import { useEffect, useState } from "react";
import { getAccount } from "../../utils/web3";
import { RecordStatus, SwapRecord, queryRecords, queryRecordsLength, updateRecord } from "../../common/db";
import Table, { ColumnsType } from "antd/es/table";
import { Space, notification } from "antd";
import { ethers } from "ethers";
import { changeTimestampToDataFormat } from "../../utils/date";
import { syncRecord } from "./sync-record";
import { SwapDriection } from "../../common/constants";
import { getAtomicSwapEther } from "../../common/ETH-HTLC";
import { getWalletClass } from "../../common/bch-wallet";
import { HTLC } from "../../lib/HTLC";
import { pkhToCashAddr } from "../../lib/common";
import { signTx } from "../../lib/pay4best";
import { hexToBin } from "@bitauth/libauth";
import { confirmOperation, showLoading, wrapOperation } from "../../utils/operation";
import { useStore } from "../../common/store";
import CONFIG from "../../CONFIG";

export default function () {
    const [list, setList] = useState<SwapRecord[]>([])
    const [pageIndex, setPageIndex] = useState(1)
    const [total, setTotal] = useState<number>(0)
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
            const records = await queryRecords(state.bchAccount, pageIndex)
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
        if (record.direction === SwapDriection.Bch2Sbch) {
            showLoading()
            const contract = await getAtomicSwapEther()
            const tx = await contract.close(record.hashLock, `0x${record.info.secret}`)
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
                await confirmOperation({ content: `The transaction has only ${confirmations} confirmations and blocks may be reorganized. Continue?` })
            }
            showLoading()
            const tx = await htlcBCH.receive(pkhToCashAddr(record.marketMaker.bchPkh, wallet.network), `0x${record.info.secret}`, 546, true)
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
            const tx0 = await contract.expire(record.hashLock)
            await updateRecord(record.id, { refundTxId: tx0.hash })
            await tx0.wait()
            record.status = RecordStatus.Refunded
            setList([...list])
            await updateRecord(record.id, { status: RecordStatus.Refunded })
        }
    }, "Refund successful")

    return <div style={{ width: 1000, margin: "0 auto", marginTop: 50 }}>
        <Table columns={columns} rowKey="hashLock" dataSource={list} pagination={{ total, pageSize: 20, current: pageIndex, onChange: (page, _) => setPageIndex(page) }} />
    </div>
}