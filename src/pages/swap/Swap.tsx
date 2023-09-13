import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Form, Input, InputNumber, Radio, Select, notification } from 'antd';
import { SwapDriection } from '../../common/constants';
import { MarketMaker, getAtomicSwapEther, getMarketMakers, getPendingBalance } from '../../common/ETH-HTLC';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import modal from 'antd/es/modal';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { confirmOperation, showLoading, wrapOperation } from '../../utils/operation';
import { HTLC } from '../../lib/HTLC';
import { cashAddrToPkh, pkhToCashAddr } from '../../lib/common';
import { setupSmartBCHNetwork } from '../../common/web3';
import { RecordStatus, insertRecord, updateRecord } from '../../common/db';
import { getWalletClass } from '../../common/bch-wallet';
import { bch2Satoshis } from '../../utils/bch';
import { broadcastTx } from '../../lib/pay4best';
import { hexToBin } from '@bitauth/libauth';
import CONFIG from '../../CONFIG';
import { getProvider } from '../../utils/web3';
import { useStore } from '../../common/store';
import toPrecision from '../../utils/precision';

type BotMarketMaker = MarketMaker & { BCHBalance: string, SBCHBalance: string }

const defaultDirection = SwapDriection.Bch2Sbch

const Swap: React.FC = () => {
    const { state, setStoreItem } = useStore()
    const [marketMakers, setMarketMakers] = useState<(BotMarketMaker[])>([])
    const [direction, setDirection] = useState<SwapDriection>(defaultDirection)
    useEffect(() => {
        const fetch = async () => {
            let marketMakers = await getMarketMakers()
            console.log("marketMakers", marketMakers)
            marketMakers = marketMakers.filter(v => (Number(v.bchPrice) == 1 && Number(v.sbchPrice) == 1) || v.penaltyBPS == 0)  // 合法的marketMakers
            marketMakers = marketMakers.filter(v => v.penaltyBPS < 1000) // 10%不合法
            const provider = getProvider()
            const [SBCHBalances, BCHBalances]: any = await Promise.all([
                Promise.all(marketMakers.map((v) => provider.getBalance(v.addr).then(ethers.utils.formatEther))),
                Promise.all(marketMakers.map(async (v) => {
                    const [BCHBalance, pendingBalance] = await Promise.all([
                        getWalletClass().fromCashaddr(pkhToCashAddr(v.bchPkh, CONFIG.MAINNET ? "mainnet" : "testnet")).then(w => w.getBalance("bch")),
                        getPendingBalance(v.addr)
                    ])
                    return Number(BCHBalance) - Number(pendingBalance) * Number(v.sbchPrice)
                })),
            ])

            setMarketMakers(marketMakers.map((v, i) => ({
                ...v,
                BCHBalance: BCHBalances[i],
                SBCHBalance: SBCHBalances[i]
            })))
        }
        fetch()
    }, [])

    const [form] = Form.useForm<{ direction: SwapDriection, marketMakerAddr: string, amount: number }>();
    const onFormLayoutChange = ({ direction: direction_ }: { direction: SwapDriection }) => {
        setDirection(direction_ || direction);
    };
    const onFinish = wrapOperation(async () => {
        if (!state.bchAccount) {
            throw new Error('Pay4best wallet not connected')
        }
        const values = form.getFieldsValue()
        if (values.amount < 0.0001) {
            throw new Error('Amount must larger than 0.0001')
        }
        const marketMaker = marketMakers.find((x: any) => x.addr === values.marketMakerAddr)!
        if (values.amount < Number(marketMaker.minSwapAmt)) {
            throw new Error(`Amount must larger than ${marketMaker.minSwapAmt}`)
        }
        if (values.amount > Number(marketMaker.maxSwapAmt)) {
            throw new Error(`Amount must less than ${marketMaker.maxSwapAmt}`)
        }
        const expectedPrice = values.direction === SwapDriection.Sbch2Bch ? marketMaker.sbchPrice : marketMaker.bchPrice
        const expectedAmount = BigNumber(values.amount).multipliedBy(expectedPrice).toString()
        if (values.direction === SwapDriection.Sbch2Bch) {
            if (Number(expectedAmount) > Number((marketMaker as any).BCHBalance)) {
                throw new Error("Insufficient balance")
            }
        } else {
            if (Number(expectedAmount) > Number((marketMaker as any).SBCHBalance)) {
                throw new Error("Insufficient balance")
            }
        }
        await confirmOperation({ content: `You will receive ${expectedAmount} ${values.direction === SwapDriection.Sbch2Bch ? "BCH" : "SBCH"}.` })
        showLoading()
        const secret = Buffer.from(window.crypto.getRandomValues(new Uint8Array(32))).toString('hex')
        const hashLock = `0x${HTLC.getHashLock(secret)}`
        const walletPkh = await cashAddrToPkh(state.bchAccount)
        const info = {
            expectedPrice,
            secret, createAt: new Date().getTime(),
            marketMakerAddr: marketMaker.addr, marketMakerBchPkh: marketMaker.bchPkh,
            amount: ethers.utils.parseEther(values.amount.toString()).toString(), walletPkh, penaltyBPS: marketMaker.penaltyBPS
        }
        let recordId: number = 0
        if (values.direction === SwapDriection.Sbch2Bch) {
            await setupSmartBCHNetwork()
            const atomicSwapEther = await getAtomicSwapEther()
            recordId = await insertRecord(state.bchAccount, SwapDriection.Sbch2Bch, hashLock, RecordStatus.Prepare, JSON.parse(JSON.stringify(marketMaker)), info)
            const tx0 = await atomicSwapEther.lock(
                marketMaker.addr, hashLock,
                marketMaker.sbchLockTime, `0x${walletPkh}`,
                info.penaltyBPS, true,
                ethers.utils.parseEther(expectedPrice),
                { value: ethers.utils.parseEther(values.amount.toString()) }
            )
            await updateRecord(recordId, { openTxId: tx0.hash })
            const tx1 = await tx0.wait()
            await updateRecord(recordId, { status: RecordStatus.New })
        } else {
            const recipientPkh = marketMaker.bchPkh
            recordId = await insertRecord(state.bchAccount, SwapDriection.Bch2Sbch, hashLock, RecordStatus.Prepare, JSON.parse(JSON.stringify(marketMaker)), info)
            const wallet = await getWalletClass().fromCashaddr(state.bchAccount)
            const htclBCH = new HTLC(wallet as any, marketMaker.bchLockTime, info.penaltyBPS)
            const unSignedTx = await htclBCH.lock(pkhToCashAddr(recipientPkh, wallet.network), state.account, hashLock, Number(bch2Satoshis(values.amount)), Math.round(Number(expectedPrice) * 1e8), true)
            const txId = await broadcastTx(wallet, unSignedTx);
            await updateRecord(recordId, { openTxId: txId, status: RecordStatus.New })
        }
    }, "Payment successful")

    return (
        <div style={{ marginTop: 50 }}>
            <Form
                form={form}
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600, margin: "0 auto" }}
                initialValues={{ direction: defaultDirection }}
                onValuesChange={onFormLayoutChange}
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item label="Direction" name="direction" rules={[{ required: true }]}>
                    <Radio.Group>
                        <Radio value={SwapDriection.Bch2Sbch}> Bch {"->"} SmartBCH </Radio>
                        <Radio value={SwapDriection.Sbch2Bch}> SmartBCH {"->"} Bch </Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="Bot" name="marketMakerAddr" rules={[{ required: true }]} >
                    <Select>
                        {marketMakers.map(({ addr, intro, bchPrice, sbchPrice, BCHBalance, SBCHBalance }) => <Select.Option key={addr} value={addr}>
                            {direction === SwapDriection.Bch2Sbch
                                ? `${intro}(1BCH==${bchPrice}SBCH)(SBCHBalance:${toPrecision(SBCHBalance, 2)})`
                                : `${intro}(1SBCH==${sbchPrice}BCH)(BCHBalance:${toPrecision(BCHBalance, 2)})`}
                        </Select.Option>)}
                    </Select>
                </Form.Item>
                <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
                    <InputNumber style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
                        Swap
                    </Button>
                </Form.Item>
            </Form>
        </div>

    )
};

export default Swap;