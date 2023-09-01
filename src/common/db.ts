import Dexie from 'dexie';
import { MarketMaker } from './ETH-HTLC';
import { SwapDriection } from './constants';

export enum RecordStatus {
    Prepare = "Prepare",
    New = "New",
    Matched = "Matched",
    Completed = "Completed",
    WaitingToExpire = "WaitingToExpire",
    Expired = "Expired",
    Refunded = "Refunded",
    Invalid = "Invalid",
}

//todo: transfer this file to db.ts
export const db: any = new Dexie('AtomicSwapEther-1');

db.version(1).stores({
    Records: '++id, direction, account, secretLock, status, openTxId',
});


export async function insertRecord(account: string, direction: SwapRecord["direction"], hashLock: string, status: SwapRecord["status"], marketMaker: SwapRecord["marketMaker"], info: SwapRecord["info"]) {
    return await await db.Records.add({
        account,
        direction,
        hashLock,
        status,
        marketMaker,
        info,
    });
}

export async function updateRecord(id: number, payload: Partial<SwapRecord>) {
    await db.Records.update(id, payload);
}

export interface SwapRecord {
    id: number
    account: string,
    direction: SwapDriection,
    hashLock: string,
    status: RecordStatus,
    openTxId?: string,
    closeTxId?: string,
    refundTxId?: string,
    marketMaker: MarketMaker
    info: {
        secret: string,
        amount: string,
        createAt: number,
        walletPkh: string
    },
    error?: string
}

export async function queryRecords(account: string, pageIndex: number): Promise<SwapRecord[]> {
    return await db.Records.where(
        {
            account,
        }
    ).reverse().offset((pageIndex - 1) * 20).limit(20).toArray()
}

export async function queryRecordsLength(account: string): Promise<number> {
    return await db.Records.where(
        {
            account,
        }
    ).count()
}