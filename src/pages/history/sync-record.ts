import { getAtomicSwapEther } from "../../common/ETH-HTLC"
import { getWalletClass } from "../../common/bch-wallet"
import { SwapDriection } from "../../common/constants"
import { RecordStatus, SwapRecord, updateRecord } from "../../common/db"
import { HTLC } from "../../lib/HTLC"

export function needSynced(record: SwapRecord) {
    return ![RecordStatus.Completed, RecordStatus.Refunded, RecordStatus.Invalid].includes(record.status)
}

async function syncBch2SbchRecord(record: SwapRecord) {
    if (!needSynced(record)) {
        return record
    }
    const contract = await getAtomicSwapEther()
    const swapState = (await contract.swaps(record.hashLock)).state
    if (swapState == 1) {
        await updateRecord(record.id, { status: RecordStatus.Matched })
        record.status = RecordStatus.Matched
        return record
    }
    if (swapState == 2) {
        await updateRecord(record.id, { status: RecordStatus.Completed })
        record.status = RecordStatus.Completed
        return record
    }

    const wallet: any = await getWalletClass().newRandom()
    const htlcBCH = new HTLC(wallet, record.marketMaker.bchLockTime, record.marketMaker.penaltyBPS)
    const bchContract = await htlcBCH.createContract(record.info.walletPkh, record.marketMaker.bchPkh, record.hashLock)
    const utxos = await bchContract.getUtxos()
    const utxo = utxos[0]

    const createAt = record.info.createAt
    const now = new Date().getTime()
    const expiredTime = createAt + record.marketMaker.bchLockTime * (60 * 10) * 1000 + 5 * 60 * 1000
    if (utxo && now > expiredTime) { // 多5min
        await updateRecord(record.id, { status: RecordStatus.Expired })
        record.status = RecordStatus.Expired
        return record
    }
    if (utxo && now < expiredTime && now > createAt + record.marketMaker.bchLockTime * (60 * 10) * 1000 / 2) {
        await updateRecord(record.id, { status: RecordStatus.WaitingToExpire })
        record.status = RecordStatus.WaitingToExpire
        return record
    }
    if ([RecordStatus.Expired].includes(record.status) && !utxo) {
        await updateRecord(record.id, { status: RecordStatus.Refunded })
        record.status = RecordStatus.Refunded
        return record
    }

    if ([RecordStatus.Prepare].includes(record.status) && !utxo && now > createAt + 60 * 1000) {
        await updateRecord(record.id, { status: RecordStatus.Invalid })
        record.status = RecordStatus.Invalid
        return record
    }

    if ([RecordStatus.Prepare].includes(record.status) && utxo) {
        await updateRecord(record.id, { status: RecordStatus.New })
        record.status = RecordStatus.New
        return record
    }

    return record
}

async function syncSbch2BchRecord(record: SwapRecord) {
    if (!needSynced(record)) {
        return record
    }

    const createAt = record.info.createAt
    const now = new Date().getTime()

    const contract = await getAtomicSwapEther()
    const swapState = (await contract.swaps(record.hashLock)).state

    if (swapState === 2) { // user receice bch then bot received
        await updateRecord(record.id, { status: RecordStatus.Completed })
        record.status = RecordStatus.Completed
        return record
    }

    if (swapState === 3) {
        await updateRecord(record.id, { status: RecordStatus.Refunded })
        record.status = RecordStatus.Refunded
        return record
    }

    const expiredTime = createAt + record.marketMaker.sbchLockTime * 1000 + 5 * 60 * 1000
    if (swapState === 1 && now > expiredTime) { // 多5min
        await updateRecord(record.id, { status: RecordStatus.Expired })
        record.status = RecordStatus.Expired
        return record
    }

    const wallet: any = await getWalletClass().newRandom()
    const htlcBCH = new HTLC(wallet, Math.floor(record.marketMaker.bchLockTime / 2), 0)
    const bchContract = await htlcBCH.createContract(record.marketMaker.bchPkh, record.info.walletPkh, record.hashLock)
    const utxos = await bchContract.getUtxos()
    const b = utxos[0]

    if (b) {
        record.status = RecordStatus.Matched
        await updateRecord(record.id, { status: RecordStatus.Matched })
        return record
    }

    if (swapState === 1 && !b && now > createAt + record.marketMaker.sbchLockTime * 1000 / 2 && now < expiredTime) {
        record.status = RecordStatus.WaitingToExpire
        await updateRecord(record.id, { status: RecordStatus.WaitingToExpire })
        return record
    }

    // Prepare => Invalid
    if ([RecordStatus.Prepare].includes(record.status) && swapState === 0 && now - createAt > 60 * 1000) { // 1 min 后无效
        await updateRecord(record.id, { status: RecordStatus.Invalid })
        record.status = RecordStatus.Invalid
        return record
    }

    if ([RecordStatus.Prepare].includes(record.status) && swapState === 1) {
        await updateRecord(record.id, { status: RecordStatus.New })
        record.status = RecordStatus.New
        return record
    }
    return record
}

export async function syncRecord(record: SwapRecord) {
    if (record.direction === SwapDriection.Bch2Sbch) {
        return await syncBch2SbchRecord(record)
    } else {
        return await syncSbch2BchRecord(record)
    }
}