import { Button, Card, DatePicker as DatePicker_, Form, Input, Switch, notification } from "antd";
import { useEffect, useState } from "react";
import { getAtomicSwapEther } from "../../common/ETH-HTLC";
import { getAccount } from "../../utils/web3";
import { ethers } from "ethers";
import dayjs from 'dayjs';
import { cashAddrToPkh, pkhToCashAddr } from "../../lib/common";
import { Mainnet } from "mainnet-js";
import CONFIG from "../../CONFIG";
import { showLoading, wrapOperation } from "../../utils/operation";

// const DatePicker = DatePicker_.generatePicker<Moment>(momentGenerateConfig);

export default function () {
    const [form] = Form.useForm<{
        addr: string,
        retiredAt: any,
        intro: string,
        botAddr: string,
        bchLockTime: string, // in blocks
        sbchLockTime: string,// in seconds
        penaltyBPS: string,
        feeBPS: string,
        minSwapAmt: string,
        maxSwapAmt: string,
        statusChecker: string
    }>();

    useEffect(() => {
        const init = async () => {
            const atomicSwapEther = await getAtomicSwapEther()
            const marketMaker = await atomicSwapEther.marketMakers(await getAccount());
            if (marketMaker.addr !== ethers.constants.AddressZero) {
                form.setFieldsValue({
                    addr: marketMaker.addr,
                    retiredAt: marketMaker.retiredAt.toNumber(),
                    intro: ethers.utils.parseBytes32String(marketMaker.intro),
                    botAddr: pkhToCashAddr(marketMaker.bchPkh, CONFIG.MAINNET ? "mainnet" : "testnet"),
                    bchLockTime: marketMaker.bchLockTime,
                    sbchLockTime: marketMaker.sbchLockTime,
                    penaltyBPS: marketMaker.penaltyBPS,
                    feeBPS: marketMaker.feeBPS,
                    minSwapAmt: ethers.utils.formatEther(marketMaker.minSwapAmt.toString()),
                    maxSwapAmt: ethers.utils.formatEther(marketMaker.maxSwapAmt.toString()),
                    statusChecker: marketMaker.statusChecker,
                })
                setHasCreated(true)
            }
        }
        init()
    }, [])

    const onFinish = wrapOperation(async () => {
        showLoading()
        const values = form.getFieldsValue()
        const atomicSwapEther = await getAtomicSwapEther()
        const tx = await atomicSwapEther.registerMarketMaker(
            ethers.utils.formatBytes32String(values.intro), `0x${cashAddrToPkh(values.botAddr)}`,
            values.bchLockTime, values.sbchLockTime, values.penaltyBPS, values.feeBPS,
            ethers.utils.parseEther(values.minSwapAmt), ethers.utils.parseEther(values.maxSwapAmt),
            values.statusChecker
        )
        await tx.wait()
        form.setFieldsValue({ addr: await getAccount() })
        setHasCreated(true)
    }, "Register success")

    const updateInfo = wrapOperation(async () => {
        showLoading()
        // update
        const atomicSwapEther = await getAtomicSwapEther()
        const tx = await atomicSwapEther.updateMarketMaker(ethers.utils.formatBytes32String(form.getFieldsValue().intro));
        await tx.wait()
    }, "Update info success")

    const retireMarketMaker = wrapOperation(async () => {
        showLoading()
        // update
        const atomicSwapEther = await getAtomicSwapEther()
        const tx = await atomicSwapEther.retireMarketMaker(form.getFieldsValue().retiredAt.unix().toString());
        await tx.wait()
    }, "Retire success")


    const [hasCreated, setHasCreated] = useState(false)

    const [unavailableForm] = Form.useForm<{
        marketMaker: string,
        unavailable: string
    }>();
    const setUnavailable = wrapOperation(async () => {
        showLoading()
        const values = unavailableForm.getFieldsValue()
        const atomicSwapEther = await getAtomicSwapEther()
        const tx = await atomicSwapEther.setUnavailable(
            values.marketMaker, values.unavailable
        )
        await tx.wait()
    }, "setUnavailable success")

    return (
        <div style={{ width: 600, margin: "0 auto", marginTop: 50 }}>
            <Card title="Base" bordered={false}>
                <Form
                    onFinish={onFinish}
                    form={form}
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    autoComplete="off"
                >
                    <Form.Item name="intro" label="Intro"
                        rules={[{ required: true, message: 'intro is required' }]} >
                        <Input suffix={hasCreated && <Button type="primary" onClick={updateInfo}>Update</Button>} />
                    </Form.Item>
                    {hasCreated && <Form.Item name="retiredAt" label="Retired Time(seconds)"
                        rules={[{ required: true, message: 'intro is required' }]} >
                        <Input disabled={!!form.getFieldValue("retiredAt")} suffix={!form.getFieldValue("retiredAt") && <Button type="primary" onClick={retireMarketMaker}>Update</Button>} />
                    </Form.Item>}
                    <Form.Item name="botAddr" label="Bot Address"
                        rules={[{ required: true, message: 'botAddr is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="bchLockTime" label="Bch Lock Time(blocks)"
                        rules={[{ required: true, message: 'bchLockTime is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="sbchLockTime" label="Sbch Lock Time(seconds)"
                        rules={[{ required: true, message: 'sbchLockTime is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="penaltyBPS" label="Penalty(%)"
                        rules={[{ required: true, message: 'penaltyBPS is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="feeBPS" label="Fee(%)"
                        rules={[{ required: true, message: 'feeBPS is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="minSwapAmt" label="Min swap amount"
                        rules={[{ required: true, message: 'minSwapAmt is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="maxSwapAmt" label="Max swap amount"
                        rules={[{ required: true, message: 'maxSwapAmt is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="statusChecker" label="Status checker"
                        rules={[{ required: true, message: 'statusChecker is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    {!hasCreated && <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Create
                        </Button>
                    </Form.Item>}
                </Form >
            </Card>
            {/* {hasCreated && <Card title="RetiredAt" bordered={false} >
                <Form
                    form={form}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    autoComplete="off"
                    onFinish={retireMarketMaker}
                >
                    <Form.Item name="retiredAt" label="RetiredAt"
                        rules={[{ required: true, message: 'retiredAt is required' }]} >
                        <DatePicker_
                            format="YYYY-MM-DD HH:mm:ss"
                        />

                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Update
                        </Button>
                    </Form.Item>
                </Form>
            </Card>} */}

            <Card title="Set Unavailable" bordered={false} >
                <Form
                    initialValues={{ unavailable: false }}
                    form={unavailableForm}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    autoComplete="off"
                    onFinish={setUnavailable}
                >
                    <Form.Item name="marketMaker" label="MarketMaker"
                        rules={[{ required: true, message: 'marketMaker is required' }]} >
                        <Input />
                    </Form.Item>
                    <Form.Item name="Unavailable" label="unavailable"
                        rules={[{ required: true, message: 'unavailable is required' }]} >
                        <Switch />
                    </Form.Item>
                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Update
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>)
}