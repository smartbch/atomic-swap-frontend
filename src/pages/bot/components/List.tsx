import { ethers } from "ethers"
import { useState, useEffect } from "react"
import CONFIG from "../../../CONFIG"
import { MarketMaker, getMarketMakers } from "../../../common/ETH-HTLC"
import { getWalletClass } from "../../../common/bch-wallet"
import { pkhToCashAddr } from "../../../lib/common"
import { getProvider } from "../../../utils/web3"
import { Table } from "antd"
import { ColumnsType } from "antd/es/table"

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
            title: 'Intro',
            dataIndex: 'intro',
            key: 'intro',
        },
        {
            title: 'RetiredTime(seconds)',
            dataIndex: 'retiredAt',
            key: 'retiredAt',
        },
        {
            title: 'Bot Address',
            dataIndex: 'bchPkh',
            key: 'bchPkh',
            render: (bchPkh) => pkhToCashAddr(bchPkh, CONFIG.MAINNET ? "mainnet" : "testnet"),
        },
        {
            title: 'Bch Lock Time(blocks)',
            dataIndex: 'sbchLockTime',
            key: 'sbchLockTime',
        },
        {
            title: 'Sbch Lock Time(seconds)',
            dataIndex: 'bchLockTime',
            key: 'bchLockTime',
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
            title: 'Min swap amount',
            dataIndex: 'minSwapAmt',
            key: 'minSwapAmt',
        },
        {
            title: 'Min swap amount',
            dataIndex: 'minSwapAmt',
            key: 'minSwapAmt',
        },
        {
            title: 'Max swap amount',
            dataIndex: 'maxSwapAmt',
            key: 'maxSwapAmt',
        },
        {
            title: 'Status Checker',
            dataIndex: 'statusChecker',
            key: 'statusChecker',
        },
    ];

    return <div>
        <Table rowKey="addr" columns={columns} dataSource={marketMakers} pagination={{ pageSize: 10000 }} />
    </div>
}