import { decodeTransaction, hexToBin, sha256, type TransactionCommon } from '@bitauth/libauth';
import { OpReturnData, SendRequest, Wallet } from "mainnet-js";
import { type SendRequestOptionsI } from "mainnet-js/dist/module/wallet/interface";
import { Contract, getSignatureTemplate } from '@mainnet-cash/contract';
import { type SignableUtxo } from 'cashscript/dist/interfaces';
import {
  bufferToHex,
  hexToBuffer,
  cashAddrToPkh,
  pkhToCashAddr,
  createRecipient,
  createUnsignedTx,
  encodeBE2,
  mnUtxoToCSUtxo,
  recipientToReq,
} from "./common";

// ../covenants/HTLC3.cash
const htlc3 = `
pragma cashscript ^0.8.0;

// Hash Time Locked Contract
contract HTLC(bytes20 senderPKH,
              bytes20 recipientPKH,
              bytes32 secretLock,
              int expiration,
              int penaltyBPS) {

    // receive by recipient
    function receive(sig recipientSig, pubkey recipientPK, bytes32 secret) {
        if (recipientSig.length > 0) {
            require(hash160(recipientPK) == recipientPKH);
            require(checkSig(recipientSig, recipientPK));
        } else {
            bytes recipientLock = new LockingBytecodeP2PKH(recipientPKH);
            require(tx.inputs[1].lockingBytecode == recipientLock);
        }

        require(this.activeInputIndex == 0);
        require(sha256(secret) == secretLock);
        // require(tx.age >= expiration);
    }

    // refund by sender
    function refund(sig senderSig, pubkey senderPK) {
        if (senderSig.length > 0) {
            require(hash160(senderPK) == senderPKH);
            require(checkSig(senderSig, senderPK));
        } else {
            bytes senderLock = new LockingBytecodeP2PKH(senderPKH);
            require(tx.inputs[1].lockingBytecode == senderLock);
        }

        require(this.activeInputIndex == 0);
        require(tx.age >= expiration);

        // give some of the fund to the recipient
        if (penaltyBPS > 0) {
            int penalty = tx.inputs[0].value * penaltyBPS / 10000;
            require(tx.outputs[0].value >= penalty);
            bytes recipientLock = new LockingBytecodeP2PKH(recipientPKH);
            require(tx.outputs[0].lockingBytecode == recipientLock);
        }
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

  // OP_RETURN "SBAS" <recipient pkh> <sender pkh> <hash lock> <expiration> <penalty bps> <sbch user address>
  static makeOpRetData(senderPkh   : string,
                       recipientPkh: string,
                       hashLock    : string,
                       expiration  : number,
                       penaltyBPS  : number,
                       sbchAddr    : string) {
    return Buffer.concat([
      // Buffer.from([0x6a]), // OP_RETURN
      Buffer.from([ 4]), Buffer.from("SBAS"),
      Buffer.from([20]), hexToBuffer(recipientPkh),
      Buffer.from([20]), hexToBuffer(senderPkh),
      Buffer.from([32]), hexToBuffer(hashLock),
      Buffer.from([ 2]), encodeBE2(expiration),
      Buffer.from([ 2]), encodeBE2(penaltyBPS),
      Buffer.from([20]), hexToBuffer(sbchAddr),
    ]);
  }

  createContract(senderPkh   : string,
                 recipientPkh: string,
                 hashLock    : string,) {
    const args = [senderPkh, recipientPkh, hashLock, this.expiration, this.penaltyBPS];
    return new Contract(htlc3, args, this.wallet.network);
  }

  async send(toCashAddr: string,
             toSbchAddr: string,
             hashLock  : string,
             amount    : number,
             buildUnsigned = false) {
    const senderPkh = cashAddrToPkh(this.wallet.getDepositAddress());
    const recipientPkh = cashAddrToPkh(toCashAddr);
    const contract = this.createContract(senderPkh, recipientPkh, hashLock);
    console.log('senderPkh   :', senderPkh);
    console.log('recipientPkh:', recipientPkh);
    console.log('hashLock    :', hashLock);

    const opRetData = HTLC.makeOpRetData(senderPkh, recipientPkh, hashLock,
        this.expiration, this.penaltyBPS, toSbchAddr);
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

  async receive(fromCashAddr: string,
                secretHex   : string, // 32 bytes
                buildUnsigned = false) {
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
    console.log('lockedUtxo:', lockedUtxo);

    const txFee = 1000
    const myUtxos = await this.wallet.getUtxos();
    const sigUtxo = myUtxos
      .filter(x => !x.token) // no token
      .find(x => x.satoshis > 1000); // have enough value
    if (!sigUtxo) {
      throw new Error("sig UTXO not found !");
    }
    console.log('sigUtxo:', sigUtxo);

    const inputs = [lockedUtxo, sigUtxo];
    const csInputs = [mnUtxoToCSUtxo(lockedUtxo), mnUtxoToCSUtxo(sigUtxo)];
    (csInputs[1] as SignableUtxo).template = buildUnsigned
      ? getSignatureTemplate(await Wallet.newRandom())
      : getSignatureTemplate(this.wallet);
    console.log('csInputs:', csInputs);

    const gotAmt = sigUtxo.satoshis + lockedUtxo.satoshis - txFee;
    const csOutputs = [
      createRecipient(this.wallet.getDepositAddress(), Number(gotAmt))
    ];
    console.log('csOutputs:', csOutputs);

    const fn = contract!.getContractFunction("receive");
    let builder = fn('', '', secretHex)
      .from(csInputs)
      .to(csOutputs)
      .withHardcodedFee(BigInt(txFee))

    if (buildUnsigned) {
      const discardChange = true;
      const opts: SendRequestOptionsI = {
        utxoIds: inputs,
        ensureUtxos: inputs,
        buildUnsigned: true,
        checkTokenQuantities: false,
      };

      let unsignedTx = await createUnsignedTx(this.wallet, csOutputs.map(recipientToReq), discardChange, opts);
      const csTx = decodeTransaction(hexToBin(await builder.build())) as TransactionCommon;
      unsignedTx.transaction.inputs[0].unlockingBytecode = csTx.inputs[0].unlockingBytecode;
      return unsignedTx
    }
    const resp = await builder.send();
    return resp;
  }

  async refund(toCashAddr: string,
               hashLock  : string,
               buildUnsigned = false) {
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

    let penalty = lockedUtxo.satoshis * this.penaltyBPS / 10000;
    if (penalty < 546) {
      penalty = 546
    }
    const txFee = 1000
    const myUtxos = await this.wallet.getUtxos();
    const sigUtxo = myUtxos
      .filter(x => !x.token) // no token
      .find(x => x.satoshis > 1000); // have enough value
    if (!sigUtxo) {
      throw new Error("sig UTXO not found !")
    }

    const refunded = sigUtxo.satoshis + lockedUtxo.satoshis - penalty - txFee;

    const inputs = [lockedUtxo, sigUtxo];
    const csInputs = [mnUtxoToCSUtxo(lockedUtxo), mnUtxoToCSUtxo(sigUtxo)];
    (csInputs[1] as SignableUtxo).template = buildUnsigned
      ? getSignatureTemplate(await Wallet.newRandom())
      : getSignatureTemplate(this.wallet);

    const csOutputs = [
      createRecipient(pkhToCashAddr(recipientPkh.replace("0x", ''), this.wallet.network), penalty),
      createRecipient(this.wallet.getDepositAddress(), Number(refunded)),
    ];

    const fn = contract!.getContractFunction("refund");
    let builder = fn("", "")
      .from(csInputs)
      .to(csOutputs)
      .withHardcodedFee(BigInt(txFee));
      // .withAge(this.expiration);
    (builder as any).sequence = this.expiration

    if (buildUnsigned) {
      const discardChange = true;
      const opts: SendRequestOptionsI = {
        utxoIds: inputs,
        ensureUtxos: inputs,
        buildUnsigned: true,
        checkTokenQuantities: false,
      };

      let unsignedTx = await createUnsignedTx(this.wallet, csOutputs.map(recipientToReq), discardChange, opts);
      const csTx = decodeTransaction(hexToBin(await builder.build())) as TransactionCommon;
      unsignedTx.transaction.inputs[0].unlockingBytecode = csTx.inputs[0].unlockingBytecode;
      unsignedTx.transaction.inputs[0].sequenceNumber = this.expiration
      return unsignedTx
    }
    const resp = await builder.send();
    return resp;
  }

}