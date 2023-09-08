import { hexToBin, sha256 } from '@bitauth/libauth';
import { OpReturnData, SendRequest, Wallet } from "mainnet-js";
import { Contract } from '@mainnet-cash/contract';
import {
  bufferToHex,
  hexToBuffer,
  cashAddrToPkh,
  pkhToCashAddr,
  createRecipient,
  createUnsignedTx,
  encodeBE2,
  encodeBE8,
  mnUtxoToCSUtxo,
} from "./common";

// ../covenants/HTLC5.cash
const htlc5 = `
pragma cashscript ^0.8.0;

// Hash Time Locked Contract v5
contract HTLC(bytes20 senderPKH,
              bytes20 receiverPKH,
              bytes32 secretLock,
              int expiration,
              int penaltyBPS) {

    // recipient unlock the coins
    function unlock(bytes32 secret) {
        require(this.activeInputIndex == 0);
        require(sha256(secret) == secretLock);

        bytes recipientLock = new LockingBytecodeP2PKH(receiverPKH);
        require(tx.outputs[0].lockingBytecode == recipientLock);
        require(tx.outputs[0].value >= tx.inputs[0].value - 2000);
    }

    // sender refund the coins after expiration
    function refund() {
        require(this.activeInputIndex == 0);
        require(tx.age >= expiration);

        int lockedVal = tx.inputs[0].value;
        int refundVal = lockedVal;
        int penalty = 0;

        // give some of the fund to the recipient
        if (penaltyBPS > 0) {
            penalty = lockedVal * penaltyBPS / 10000;
            refundVal = lockedVal - penalty;

            bytes recipientLock = new LockingBytecodeP2PKH(receiverPKH);
            require(tx.outputs[1].lockingBytecode == recipientLock);
            require(tx.outputs[1].value >= penalty);
        }

        bytes senderLock = new LockingBytecodeP2PKH(senderPKH);
        require(tx.outputs[0].lockingBytecode == senderLock);
        require(tx.outputs[0].value >= refundVal - 2000);
    }

}
`

export class HTLC {

  constructor(private wallet    : Wallet,
              private expiration: number, // in blocks
              private penaltyBPS: number) {
  }

  static getHashLock(secretHex: string): string {
    const secretData = hexToBin(secretHex.replace('0x', ''));
    return Buffer.from(sha256.hash(secretData)).toString('hex');
  }

  // OP_RETURN "SBAS" <recipient pkh> <sender pkh> <hash lock> <expiration> <penalty bps> <sbch user address> <expected price>
  static makeOpRetData(senderPkh    : string,
                       recipientPkh : string,
                       hashLock     : string,
                       expiration   : number,
                       penaltyBPS   : number,
                       sbchAddr     : string,
                       expectedPrice: number) {
    return Buffer.concat([
      // Buffer.from([0x6a]), // OP_RETURN
      Buffer.from([ 4]), Buffer.from("SBAS"),
      Buffer.from([20]), hexToBuffer(recipientPkh),
      Buffer.from([20]), hexToBuffer(senderPkh),
      Buffer.from([32]), hexToBuffer(hashLock),
      Buffer.from([ 2]), encodeBE2(expiration),
      Buffer.from([ 2]), encodeBE2(penaltyBPS),
      Buffer.from([20]), hexToBuffer(sbchAddr),
      Buffer.from([ 8]), encodeBE8(expectedPrice),
    ]);
  }

  createContract(senderPkh   : string,
                 recipientPkh: string,
                 hashLock    : string,) {
    const args = [senderPkh, recipientPkh, hashLock, this.expiration, this.penaltyBPS];
    return new Contract(htlc5, args, this.wallet.network);
  }

  async lock(toCashAddr   : string,
             toSbchAddr   : string,
             hashLock     : string,
             amount       : number,
             expectedPrice: number,
             buildUnsigned = false) {
    const senderPkh = cashAddrToPkh(this.wallet.getDepositAddress());
    const recipientPkh = cashAddrToPkh(toCashAddr);
    const contract = this.createContract(senderPkh, recipientPkh, hashLock);
    console.log('senderPkh   :', senderPkh);
    console.log('recipientPkh:', recipientPkh);
    console.log('hashLock    :', hashLock);

    const opRetData = HTLC.makeOpRetData(senderPkh, recipientPkh, hashLock,
        this.expiration, this.penaltyBPS, toSbchAddr, expectedPrice);
    console.log('opRetData   :', opRetData.toString('hex'));

    const reqs: any = [new SendRequest({
      cashaddr: contract!.getDepositAddress(),
      value: amount,
      unit: 'sat',
    })]
    const opRet = OpReturnData.fromBuffer(hexToBuffer(`0x6a${bufferToHex(opRetData).replace("0x", "")}`))
    reqs.push(opRet);

    if (buildUnsigned) {
      const discardChange = false;
      const opts = { buildUnsigned: true };
      const unsignedTx = await createUnsignedTx(this.wallet, reqs, discardChange, opts);
      return unsignedTx
    }
    return this.wallet.send(reqs);
  }

  async unlock(fromCashAddr: string,
               secretHex   : string, // 32 bytes
               minSatoshis: number,
               minerFee = 1000,
               dryRun = false) {
    const senderPkh = cashAddrToPkh(fromCashAddr);
    const recipientPkh = cashAddrToPkh(this.wallet.getDepositAddress());
    const hashLock = HTLC.getHashLock(secretHex);
    const contract = this.createContract(senderPkh, recipientPkh, hashLock);
    console.log('senderPkh   :', senderPkh);
    console.log('recipientPkh:', recipientPkh);
    console.log('hashLock    :', hashLock);
    console.log('secret      :', secretHex);

    const lockedUtxos = await contract!.getUtxos();
    const lockedUtxo = lockedUtxos[0]
    if (!lockedUtxo) {
      throw new Error("covenant UTXO not found !");
    }
    if(lockedUtxo.satoshis < minSatoshis) {
      throw new Error("Incorect satoshis!");
    }
    console.log('lockedUtxo:', lockedUtxo);

    const input = mnUtxoToCSUtxo(lockedUtxo);
    console.log('input:', input);

    const gotAmt = lockedUtxo.satoshis - minerFee;
    const output = createRecipient(this.wallet.getDepositAddress(), Number(gotAmt));
    console.log('output:', output);

    const fn = contract!.getContractFunction("unlock");
    const builder = fn(secretHex)
      .from([input])
      .to([output])
      .withHardcodedFee(BigInt(minerFee));

    if (dryRun) {
      return await builder.build();
    } else {
      return await builder.send();
    }
  }

  async refund(toCashAddr: string,
               hashLock  : string,
               minerFee = 1000,
               dryRun = false) {
    const senderPkh = cashAddrToPkh(this.wallet.getDepositAddress())
    const recipientPkh = cashAddrToPkh(toCashAddr);
    const contract = this.createContract(senderPkh, recipientPkh, hashLock);
    console.log('senderPkh   :', senderPkh);
    console.log('recipientPkh:', recipientPkh);
    console.log('hashLock    :', hashLock);

    const lockedUtxos = await contract!.getUtxos();
    const lockedUtxo = lockedUtxos[0]
    if (!lockedUtxo) {
      throw new Error("covenant UTXO not found !")
    }
    console.log('lockedUtxo:', lockedUtxo);

    const penalty = Math.max(Math.ceil(lockedUtxo.satoshis * this.penaltyBPS / 10000), 546);
    const refunded = lockedUtxo.satoshis - penalty - minerFee;

    const input = mnUtxoToCSUtxo(lockedUtxo);
    console.log('input:', input);

    const outputs = [
      createRecipient(this.wallet.getDepositAddress(), Number(refunded)),
      createRecipient(pkhToCashAddr(recipientPkh.replace("0x", ''), this.wallet.network), penalty),
    ];
    console.log('outputs:', outputs);

    const fn = contract!.getContractFunction("refund");
    const builder = fn()
      .from([input])
      .to(outputs)
      .withHardcodedFee(BigInt(minerFee));
      // .withAge(this.expiration);
    (builder as any).sequence = this.expiration

    if (dryRun) {
      return await builder.build();
    } else {
      return await builder.send();
    }
  }

}