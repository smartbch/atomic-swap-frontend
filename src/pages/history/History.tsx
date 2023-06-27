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
import { useGloabalStore } from "../../common/store";
import { getWalletClass } from "../../common/bch-wallet";
import { HTLC } from "../../lib/HTLC";
import { pkhToCashAddr } from "../../lib/common";
import { signTx } from "../../lib/pay4best";
import { hexToBin } from "@bitauth/libauth";

export default function () {
    const [list, setList] = useState<SwapRecord[]>([])
    const [pageIndex, setPageIndex] = useState(1)
    const [total, setTotal] = useState<number>(0)
    const [gloabalStore, setGloabalStoreStoreItem] = useGloabalStore()

    const columns: ColumnsType<SwapRecord> = [
        {
            title: 'Direction',
            dataIndex: 'direction',
            key: 'direction',
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
            title: 'CreateAt',
            key: 'createAt',
            render: (_, record) => changeTimestampToDataFormat(record.info.createAt),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    {record.status === RecordStatus.Matched && <a onClick={() => withdraw(record)}>withdraw</a>}
                    {record.status === RecordStatus.Expired && <a onClick={() => refund(record)}>refund</a>}
                </Space>
            ),
        },
    ];

    useEffect(() => {
        const init = async () => {
            const account = await getAccount()
            setTotal(await queryRecordsLength(account))

            // const records = await queryRecords(account, 1)
            // setList(records)
        }
        init()
    }, [])

    useEffect(() => {
        const fetch = async () => {
            const account = await getAccount()
            const records = await queryRecords(account, pageIndex)
            syncRecords(records)
        }
        fetch()
    }, [pageIndex])

    const syncRecords = async (records: SwapRecord[]) => {
        for (let record of records) {
            record.status = (await syncRecord(record)).status
        }
        setList(records)
    }

    useEffect(() => {
        const timer = setInterval(() => () => syncRecords(list), 20000);
        return () => clearInterval(timer);
    }, []);


    const withdraw = async (record: SwapRecord) => {
        try {
            if (record.direction === SwapDriection.Bch2Sbch) {
                const contract = await getAtomicSwapEther()
                const tx = await contract.close(record.hashLock, `0x${record.info.secret}`)
                await updateRecord(record.id, { closeTxId: tx.hash })
                await tx.wait()
                record.status = RecordStatus.Completed
                setList(list)
                await updateRecord(record.id, { status: RecordStatus.Completed })
            } else {
                const wallet = await getWalletClass().watchOnly(gloabalStore.bchAccount)
                const htclBCH = new HTLC(wallet as any, record.marketMaker.bchLockTime / 2, 0)
                const unSignedTx = await htclBCH.receive(pkhToCashAddr(record.marketMaker.bchPkh, wallet.network), `0x${record.info.secret}`, true)
                const signedTx = await signTx(unSignedTx);
                const txid = await wallet.submitTransaction(hexToBin(signedTx))
                record.status = RecordStatus.Completed
                setList(list)
                await updateRecord(record.id, { status: RecordStatus.Completed, closeTxId: txid })
            }
            notification.success({
                message: 'success',
                description: "withdraw pay"
            })
        } catch (error: any) {
            console.log(error)
            notification.error({
                message: 'error',
                description: error.message
            });
        }
    }

    const refund = async (record: SwapRecord) => {
        try {
            if (record.direction === SwapDriection.Bch2Sbch) {
                const wallet = await getWalletClass().watchOnly(gloabalStore.bchAccount)
                const htclBCH = new HTLC(wallet as any, record.marketMaker.bchLockTime, record.marketMaker.penaltyBPS)
                const unSignedTx = await htclBCH.refund(pkhToCashAddr(record.marketMaker.bchPkh, wallet.network), record.hashLock, true)
                const signedTx = await signTx(unSignedTx);
                const txid = await wallet.submitTransaction(hexToBin(signedTx))
                record.status = RecordStatus.Refunded
                setList(list)
                await updateRecord(record.id, { status: RecordStatus.Refunded, refundTxId: txid })
            } else {
                const contract = await getAtomicSwapEther()
                const tx0 = await contract.expire(record.hashLock)
                await updateRecord(record.id, { refundTxId: tx0.hash })
                await tx0.wait()
                record.status = RecordStatus.Refunded
                setList(list)
                await updateRecord(record.id, { status: RecordStatus.Refunded })
            }
            notification.success({
                message: 'success',
                description: "Refund pay"
            })
        } catch (error: any) {
            console.log(error)
            notification.error({
                message: 'error',
                description: error.message
            });
        }
    }

    return <Table columns={columns} rowKey="hashLock" dataSource={list} pagination={{ total, pageSize: 20, current: pageIndex, onChange: (page, _) => setPageIndex(page) }} />
}