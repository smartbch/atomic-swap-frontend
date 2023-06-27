import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Form, Input, InputNumber, Radio, Select, notification } from 'antd';
import { SwapDriection } from '../../common/constants';
import { MarketMaker, getAtomicSwapEther, getMarketMakers } from '../../common/ETH-HTLC';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import modal from 'antd/es/modal';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { confirmOperation } from '../../utils/operation';
import { HTLC } from '../../lib/HTLC';
import { cashAddrToPkh, pkhToCashAddr } from '../../lib/common';
import { useGloabalStore } from '../../common/store';
import { setupSmartBCHNetwork } from '../../common/web3';
import { RecordStatus, insertRecord, updateRecord } from '../../common/db';
import { getWalletClass } from '../../common/bch-wallet';
import { bch2Satoshis } from '../../utils/utils';
import { signTx } from '../../lib/pay4best';
import { hexToBin } from '@bitauth/libauth';



const User: React.FC = () => {
    const [gloabalStore, setGloabalStoreStoreItem] = useGloabalStore()
    console.log(123, gloabalStore)

    const [marketMakers, setMarketMakers] = useState<MarketMaker[]>([])
    const [direction, setDirection] = useState<SwapDriection>(SwapDriection.Sbch2Bch)
    useEffect(() => {
        const fetch = async () => {
            setMarketMakers(await getMarketMakers())
        }
        fetch()
    }, [])

    const [form] = Form.useForm<{ direction: SwapDriection, marketMakerAddr: string, amount: number }>();
    const onFormLayoutChange = ({ direction: direction_ }: { direction: SwapDriection }) => {
        setDirection(direction_);
    };
    const onFinish = async () => {
        try {
            const values = form.getFieldsValue()
            if (values.amount < 0.0001) {
                throw new Error('Amount must larger than 0.0001')
            }
            const marketMaker: MarketMaker = marketMakers.find((x: any) => x.addr === values.marketMakerAddr)!
            if (values.amount < Number(marketMaker.minSwapAmt)) {
                throw new Error(`Amount must larger than ${marketMaker.minSwapAmt}`)
            }
            if (values.amount > parseFloat(marketMaker.maxSwapAmt)) {
                throw new Error(`Amount must less than ${marketMaker.maxSwapAmt}`)
            }
            // if (values.direction === Direction.Sbch2Bch) {
            //     if (form.amount > (marketMaker as any).BCHBalance) {
            //         showFailToast("insufficient balance ")
            //         return
            //     }
            // } else {
            //     if (form.amount > (marketMaker as any).SBCHBalance) {
            //         showFailToast("insufficient balance")
            //         return
            //     }
            // }
            const receivedAmount = BigNumber(ethers.utils.parseEther(values.amount.toString()).mul(10000 - marketMaker.feeBPS).div(10000).toString()).div(ethers.constants.WeiPerEther.toString()).toString()
            await confirmOperation({ content: `You will receive ${receivedAmount} bch` })
            const secret = Buffer.from(window.crypto.getRandomValues(new Uint8Array(32))).toString('hex')
            const hashLock = `0x${HTLC.getHashLock(secret)}`
            const walletPkh = await cashAddrToPkh(gloabalStore.bchAccount)
            const info = {
                secret, createAt: new Date().getTime(),
                marketMakerAddr: marketMaker.addr, marketMakerBchPkh: marketMaker.bchPkh,
                amount: ethers.utils.parseEther(values.amount.toString()).toString(), walletPkh, penaltyBPS: marketMaker.penaltyBPS
            }
            let recordId: number = 0
            if (values.direction === SwapDriection.Sbch2Bch) {
                await setupSmartBCHNetwork()
                const atomicSwapEther = await getAtomicSwapEther()
                recordId = await insertRecord(gloabalStore.account, SwapDriection.Sbch2Bch, hashLock, RecordStatus.Prepare, JSON.parse(JSON.stringify(marketMaker)), info)
                const tx0 = await atomicSwapEther.open(marketMaker.addr, hashLock, marketMaker.sbchLockTime, `0x${walletPkh}`, info.penaltyBPS,
                    { value: ethers.utils.parseEther(values.amount.toString()) })
                await updateRecord(recordId, { openTxId: tx0.hash })
                const tx1 = await tx0.wait()
                await updateRecord(recordId, { status: RecordStatus.New })
            } else {
                const recipientPkh = marketMaker.bchPkh
                recordId = await insertRecord(gloabalStore.account, SwapDriection.Bch2Sbch, hashLock, RecordStatus.Prepare, JSON.parse(JSON.stringify(marketMaker)), info)
                const wallet = await getWalletClass().fromCashaddr(gloabalStore.bchAccount)
                const htclBCH = new HTLC(wallet as any, marketMaker.bchLockTime, info.penaltyBPS)
                const unSignedTx = await htclBCH.send(pkhToCashAddr(recipientPkh, wallet.network), gloabalStore.account, hashLock, Number(bch2Satoshis(values.amount)), true)
                const signedTx = await signTx(unSignedTx);
                const txId = await wallet.submitTransaction(hexToBin(signedTx))
                await updateRecord(recordId, { openTxId: txId, status: RecordStatus.New })
            }
            notification.success({
                message: 'success',
                description: "Success pay"
            });
        } catch (error: any) {
            console.log(error)
            notification.error({
                message: 'error',
                description: error.message
            });
        }
    };

    return (
        <div style={{ marginTop: 50 }}>
            <Form
                form={form}
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600, margin: "0 auto" }}
                initialValues={{ direction: SwapDriection.Sbch2Bch }}
                onValuesChange={onFormLayoutChange}
                onFinish={onFinish}
                autoComplete="off"
            >
                <Form.Item label="Direction" name="direction" rules={[{ required: true }]}>
                    <Radio.Group>
                        <Radio value={SwapDriection.Bch2Sbch}> Bch2Sbch </Radio>
                        <Radio value={SwapDriection.Sbch2Bch}> Sbch2Bch </Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item label="MarketMaker" name="marketMakerAddr" rules={[{ required: true }]} >
                    <Select>
                        {marketMakers.map(({ addr, intro, feeBPS }) => <Select.Option key={addr} value={addr}>
                            {direction === SwapDriection.Bch2Sbch
                                ? `${intro}(fee:${feeBPS / 100}%)`
                                : `${intro}(fee:${feeBPS / 100}%)`}
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

export default User;