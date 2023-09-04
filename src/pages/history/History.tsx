import { useEffect, useState } from "react";
import { getAccount } from "../../utils/web3";
import { RecordStatus, SwapRecord, queryRecords, queryRecordsLength, updateRecord } from "../../common/db";
import Table, { ColumnsType } from "antd/es/table";
import { Space, notification } from "antd";
import { ethers } from "ethers";
import { changeTimestampToDataFormat } from "../../utils/date";
import { syncRecord } from "./sync-record";
import { SwapDriection } from "../../common/constants";
import { MarketMaker, getAtomicSwapEther, getMarketMakers } from "../../common/ETH-HTLC";
import { getWalletClass } from "../../common/bch-wallet";
import { HTLC } from "../../lib/HTLC";
import { cashAddrToPkh, pkhToCashAddr } from "../../lib/common";
import { signTx } from "../../lib/pay4best";
import { hexToBin, parseScript } from "@bitauth/libauth";
import { confirmOperation, showLoading, wrapOperation } from "../../utils/operation";
import { useStore } from "../../common/store";
import CONFIG from "../../CONFIG";
import { reverseHexBytes } from "../../common/utils";
import { bch2Satoshis } from "../../utils/bch";
import BigNumber from "bignumber.js";

async function getSbchLockRecords(makers: MarketMaker[], account: string, bchAccount: string) {
    // get events from sbch
    const atomicSwapEther = await getAtomicSwapEther()
    const lockFilter = atomicSwapEther.filters.Lock(account);
    const lockEvents = await atomicSwapEther.queryFilter(lockFilter, -34560, "latest")
    let recordsOnChain: SwapRecord[] = []
    lockEvents.forEach(({ args, transactionHash }: any) => {
        const maker = makers.find(x => x.addr === args._receiver)!
        if (!maker) {
            return
        }
        recordsOnChain.push({
            id: args._secretLock,
            direction: SwapDriection.Sbch2Bch,
            hashLock: args._secretLock,
            status: RecordStatus.New,
            openTxId: transactionHash,
            info: {
                expectedPrice: ethers.utils.formatEther(args._expectedPrice),
                amount: args._value.toString(),
                createAt: Number(args._createdTime.toString()) * 1000,
                walletPkh: cashAddrToPkh(bchAccount)
            },
            marketMaker: maker
        } as any)
    })
    return recordsOnChain
}

async function getBchLockRecords(makers: MarketMaker[], account: string, bchAccount: string) {
    // get events from bch
    const wallet = await getWalletClass().fromCashaddr(bchAccount)
    let [latestBlockHeight, txs] = await Promise.all([wallet.provider.getBlockHeight(), wallet.getRawHistory()])
    txs = txs.filter(v => v.height > (latestBlockHeight - 288))
    const txInfos = await Promise.all(txs.map(tx => wallet.provider.getRawTransactionObject(tx.tx_hash)))
    let recordsOnChain: SwapRecord[] = []
    txInfos.forEach(v => {
        if (v.vout.length < 2) {
            return
        }
        const items = v.vout[1].scriptPubKey.asm.split(" ")
        const pkh = cashAddrToPkh(bchAccount).replace("0x", '')
        if (items.length === 9 && items[0] === "OP_RETURN" && items[3] === pkh && items[7] === account.replace("0x", '').toLowerCase()) {
            const _secretLock = `0x${items[4]}`
            const bchPkh = items[2]
            const maker = makers.find(x => x.bchPkh === `0x${bchPkh}`)!
            if (!maker) {
                return
            }
            recordsOnChain.push({
                id: _secretLock,
                direction: SwapDriection.Bch2Sbch,
                hashLock: _secretLock,
                status: RecordStatus.New,
                openTxId: v.txid,
                info: {
                    expectedPrice: Number(`0x${v.vout[1].scriptPubKey.hex.slice(-16)}`) / 1e8,
                    amount: ethers.utils.parseEther(v.vout[0].value.toString()).toString(),
                    createAt: v.time * 1000,
                    walletPkh: cashAddrToPkh(bchAccount)
                },
                marketMaker: maker
            } as any)
        }
    })
    return recordsOnChain
}

export default function () {
    const [list, setList] = useState<SwapRecord[]>([])
    const [pageIndex, setPageIndex] = useState(1)
    const [total, setTotal] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const { state, setStoreItem } = useStore()

    const columns: ColumnsType<SwapRecord> = [
        {
            title: 'Direction',
            dataIndex: 'direction',
            key: 'direction',
            render: (direction) => direction === SwapDriection.Bch2Sbch ? "Bch -> SmartBCH" : "SmartBCH -> Bch"
        },
        {
            title: 'Amount',
            dataIndex: 'info.amount',
            key: 'amount',
            render: (_, record) => ethers.utils.formatEther(record.info.amount),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Price',
            key: 'price',
            render: (_, record) => record.direction === SwapDriection.Bch2Sbch ? record.marketMaker.bchPrice : record.marketMaker.sbchPrice,
        },
        {
            title: 'Create Time',
            key: 'createAt',
            render: (_, record) => changeTimestampToDataFormat(record.info.createAt),
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Space size="middle">
                    <a href={getTxUrl(record)} target="_blank" >View</a>
                    {record.status === RecordStatus.Matched && <a onClick={() => withdraw(record)}>Withdraw</a>}
                    {record.status === RecordStatus.Expired && <a onClick={() => refund(record)}>Refund</a>}
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const init = async () => {
            if (!state.bchAccount) {
                return
            }
            setTotal(await queryRecordsLength(state.bchAccount))

            // const records = await queryRecords(account, 1)
            // setList(records)
        }
        init()
    }, [state.bchAccount])

    useEffect(() => {
        const fetch = async () => {
            if (!state.bchAccount) {
                return
            }
            let recordsOnChain: SwapRecord[] = []
            if (pageIndex == 1) {
                const makers = await getMarketMakers()
                const [sbchRecords, bchRecords] = await Promise.all([getSbchLockRecords(makers, state.account, state.bchAccount), getBchLockRecords(makers, state.account, state.bchAccount)])
                recordsOnChain = recordsOnChain.concat(sbchRecords, bchRecords)
                recordsOnChain = recordsOnChain.sort(function (a, b) { return b.info.createAt - a.info.createAt });
            }

            let records = await queryRecords(state.bchAccount, pageIndex)
            recordsOnChain = recordsOnChain.filter(x => !records.some(v => v.hashLock === x.hashLock))
            records = recordsOnChain.concat(records)
            setLoading(false)
            setList(records)

            console.log("syncRecords", records)
            for (let record of records) {
                record.status = (await syncRecord(record)).status
            }
            setList([...records])
        }
        fetch()
    }, [pageIndex, state.bchAccount])

    const getTxUrl = (record: SwapRecord) => {
        if (record.direction === SwapDriection.Sbch2Bch) {
            return "https://www.smartscan.cash/transaction/" + record.openTxId
        }
        return (CONFIG.MAINNET ? "https://blockchair.com/bitcoin-cash/transaction/" : "https://chipnet.imaginary.cash/tx/") + record.openTxId;
    }


    const withdraw = wrapOperation(async (record: SwapRecord) => {
        if (!record.info.secret) {
            throw new Error("You have lost the secret, please wait for the refund")
        }
        if (record.direction === SwapDriection.Bch2Sbch) {
            showLoading()
            const contract = await getAtomicSwapEther()
            const tx = await contract.unlock(record.marketMaker.addr, record.hashLock, `0x${record.info.secret}`)
            await updateRecord(record.id, { closeTxId: tx.hash })
            await tx.wait()
            record.status = RecordStatus.Completed
            setList([...list])
            await updateRecord(record.id, { status: RecordStatus.Completed })
        } else {
            const wallet = await getWalletClass().watchOnly(state.bchAccount)
            const htlcBCH = new HTLC(wallet as any, Math.floor(record.marketMaker.bchLockTime / 2), 0)
            const bchContract = await htlcBCH.createContract(record.marketMaker.bchPkh, record.info.walletPkh, record.hashLock)
            const utxo = (await bchContract.getUtxos())[0]
            const { confirmations = 0 } = await (bchContract as any).provider.performRequest("blockchain.transaction.get", utxo.txid, true)
            if (confirmations < 10) {
                await confirmOperation({ content: `The transaction has only ${confirmations} confirmations and blocks may be reorganized.` })
            }
            showLoading()
            const expectedAmount = bch2Satoshis(BigNumber(ethers.utils.formatEther(record.info.amount)).multipliedBy(record.info.expectedPrice).toString())
            const tx = await htlcBCH.unlock(pkhToCashAddr(record.marketMaker.bchPkh, wallet.network), `0x${record.info.secret}`, Number(expectedAmount), 546, true)
            const txid = await wallet.submitTransaction(hexToBin(tx as string))
            record.status = RecordStatus.Completed
            setList([...list])
            await updateRecord(record.id, { status: RecordStatus.Completed, closeTxId: txid })
        }
    }, "Withdraw successful")

    const refund = wrapOperation(async (record: SwapRecord) => {
        showLoading()
        if (record.direction === SwapDriection.Bch2Sbch) {
            const wallet = await getWalletClass().watchOnly(state.bchAccount)
            const htlcBCH = new HTLC(wallet as any, record.marketMaker.bchLockTime, record.marketMaker.penaltyBPS)
            const tx = await htlcBCH.refund(pkhToCashAddr(record.marketMaker.bchPkh, wallet.network), record.hashLock, 546, true)
            const txid = await wallet.submitTransaction(hexToBin(tx as string))
            record.status = RecordStatus.Refunded
            setList([...list])
            await updateRecord(record.id, { status: RecordStatus.Refunded, refundTxId: txid })
        } else {
            const contract = await getAtomicSwapEther()
            const tx0 = await contract.refund(state.account, record.hashLock)
            await updateRecord(record.id, { refundTxId: tx0.hash })
            await tx0.wait()
            record.status = RecordStatus.Refunded
            setList([...list])
            await updateRecord(record.id, { status: RecordStatus.Refunded })
        }
    }, "Refund successful")

    return <div style={{ width: 1000, margin: "0 auto", marginTop: 50 }}>
        <Table loading={loading} columns={columns} rowKey="hashLock" dataSource={list} pagination={{ total, pageSize: 20, current: pageIndex, onChange: (page, _) => setPageIndex(page) }} />
    </div>
}