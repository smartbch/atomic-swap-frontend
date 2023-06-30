import { ethers } from "ethers"
import { useState, useEffect } from "react"
import CONFIG from "../../../CONFIG"
import { MarketMaker, getMarketMakers } from "../../../common/ETH-HTLC"
import { getWalletClass } from "../../../common/bch-wallet"
import { pkhToCashAddr } from "../../../lib/common"
import { getProvider } from "../../../utils/web3"
import { Table, Tooltip } from "antd"
import { ColumnsType } from "antd/es/table"
import { changeTimestampToDataFormat } from "../../../utils/date"

type BotMarketMaker = MarketMaker & { BCHBalance: string, SBCHBalance: string }

export default function () {
    const [marketMakers, setMarketMakers] = useState<(BotMarketMaker[])>([])
    useEffect(() => {
        const fetch = async () => {
            const marketMakers = await getMarketMakers()
            console.log("marketMakers", marketMakers)
            const provider = getProvider()
            const [SBCHBalances, BCHBalances]: any = await Promise.all([
                Promise.all(marketMakers.map((v) => provider.getBalance(v.addr).then(ethers.utils.formatEther))),
                Promise.all(marketMakers.map((v) => getWalletClass().fromCashaddr(pkhToCashAddr(v.bchPkh, CONFIG.MAINNET ? "mainnet" : "testnet")).then(w => w.getBalance("bch")))),
            ])

            setMarketMakers(marketMakers.map((v, i) => ({
                ...v,
                BCHBalance: SBCHBalances[i],
                SBCHBalance: BCHBalances[i]
            })))
        }
        fetch()
    }, [])

    const columns: ColumnsType<BotMarketMaker> = [
        {
            title: 'EVM Address',
            dataIndex: 'addr',
            key: 'addr',
            fixed: 'left',
            width: 120,
            render: (addr) => <Tooltip placement="topLeft" title={addr}>
                <a>{addr.slice(0, 10)}</a>
            </Tooltip>
        },
        {
            title: 'Intro',
            dataIndex: 'intro',
            key: 'intro',
            width: 120,
            fixed: 'left',
        },
        {
            title: 'BCHBalance',
            dataIndex: 'BCHBalance',
            key: 'BCHBalance',
        },
        {
            title: 'SBCHBalance',
            dataIndex: 'SBCHBalance',
            key: 'SBCHBalance',
        },
        {
            title: 'BCH Address',
            dataIndex: 'bchPkh',
            key: 'bchPkh',
            render: (bchPkh) => <Tooltip placement="topLeft" title={pkhToCashAddr(bchPkh, CONFIG.MAINNET ? "mainnet" : "testnet")}>
                <a>{pkhToCashAddr(bchPkh, CONFIG.MAINNET ? "mainnet" : "testnet").replace("bchtest:", '').replace("bitcoincash:", '').slice(0, 10)}</a>
            </Tooltip>
        },
        {
            title: 'Bch Lock Time(blocks)',
            dataIndex: 'bchLockTime',
            key: 'bchLockTime',
        },
        {
            title: 'Sbch Lock Time(seconds)',
            dataIndex: 'sbchLockTime',
            key: 'sbchLockTime',
        },
        {
            title: 'Penalty(‱)',
            dataIndex: 'penaltyBPS',
            key: 'penaltyBPS',
        },
        {
            title: 'Fee(‱)',
            dataIndex: 'feeBPS',
            key: 'feeBPS',
        },
        {
            title: 'Swap Amount Range',
            key: 'minSwapAmt',
            render: (_, record) => `${record.minSwapAmt}-${record.maxSwapAmt}`
        },
        {
            title: 'Status Checker',
            dataIndex: 'statusChecker',
            key: 'statusChecker',
            render: (statusChecker) => <Tooltip placement="topLeft" title={statusChecker}>
                <a>{statusChecker.slice(0, 10)}</a>
            </Tooltip>
        },
        {
            title: 'Retired Time',
            dataIndex: 'retiredAt',
            key: 'retiredAt',
            render: (retiredAt) => retiredAt === 0 ? '' : changeTimestampToDataFormat(retiredAt * 1000),
            width: 150
        },
    ];

    return <div>
        <Table scroll={{ x: 2000 }} rowKey="addr" columns={columns} dataSource={marketMakers} pagination={{ pageSize: 10000 }} />
    </div>
}