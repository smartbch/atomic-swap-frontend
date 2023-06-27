import { decodeTransaction, type TransactionCommon } from '@bitauth/libauth';
import { OpReturnData, SendRequest, TokenSendRequest, type UtxoI, deriveTokenaddr } from "mainnet-js";
import {
  encodeLockingBytecodeP2pkh,
  lockingBytecodeToCashAddress,
  cashAddressToLockingBytecode,
  CashAddressNetworkPrefix,
} from '@bitauth/libauth';
import type { Utxo, Recipient } from 'cashscript';
import type { Wallet } from "mainnet-js";
import type { SendRequestOptionsI } from 'mainnet-js/dist/module/wallet/interface';

export type MnUtxo = UtxoI
export type CsUtxo = Utxo

export function pkhToCashAddr(pkh: string, network: string) {
  const prefix = network == 'testnet'
    ? CashAddressNetworkPrefix.testnet
    : CashAddressNetworkPrefix.mainnet;
  const pkScript = encodeLockingBytecodeP2pkh(Buffer.from(pkh.replace("0x", ''), 'hex'));
  const p2pkhAddr = lockingBytecodeToCashAddress(pkScript, prefix);
  return p2pkhAddr as string;
}

export function cashAddrToPkh(addr: string): string {
  const lock = cashAddressToLockingBytecode(addr);
  const lockHex = Buffer.from((lock as any).bytecode).toString('hex');
  const pkh = lockHex.substring(6, lockHex.length - 4);
  return pkh;
}

export function mnUtxoToCSUtxo(x: MnUtxo): CsUtxo {
  const result: CsUtxo = {
    txid: x.txid,
    vout: x.vout,
    satoshis: BigInt(x.satoshis),
  };
  if (x.token) {
    result.token = {
      amount: BigInt(x.token.amount || 0),
      category: x.token.tokenId,
    }
    if (x.token.commitment) {
      result.token.nft = {
        capability: x.token.capability!,
        commitment: x.token.commitment,
      }
    }
  }
  return result;
}

export function createRecipient(to: string, bchValue: number, tokenId?: string, tokenAmount?: number): Recipient {
  let recipient: Recipient = {
    to: to,
    amount: BigInt(bchValue),
  };

  if (tokenId) {
    recipient.token = {
      amount: BigInt(tokenAmount!),
      category: tokenId,
    };
  }
  return recipient;
}

export async function createUnsignedTx(wallet: Wallet, reqs: Array<SendRequest | TokenSendRequest | OpReturnData>, discardChange: boolean, opts: SendRequestOptionsI): Promise<any> {
  const { encodedTransaction, sourceOutputs } = await wallet.encodeTransaction(reqs, discardChange, opts);
  const transaction = decodeTransaction(encodedTransaction) as TransactionCommon;
  return { transaction, sourceOutputs }
}

export function recipientToReq(r: Recipient): SendRequest | TokenSendRequest {
  if (!r.token) {
    return new SendRequest({
      cashaddr: r.to,
      value: Number(r.amount),
      unit: 'sat',
    });
  } else {
    return new TokenSendRequest({
      cashaddr: r.to,
      value: Number(r.amount),
      amount: Number(r.token.amount),
      tokenId: r.token.category,
      capability: r.token.nft?.capability,
      commitment: r.token.nft?.commitment,
    });
  }
}

export function hexToBuffer(s: string): Buffer {
  return Buffer.from(s.replace('0x', ''), 'hex');
}

export function bufferToHex(b: Buffer): string {
  return '0x' + b.toString('hex');
}

export function encodeBE2(n: number): Buffer {
  const timeLock = Buffer.alloc(2);
  timeLock.writeUIntBE(n, 0, 2);
  return timeLock;
}