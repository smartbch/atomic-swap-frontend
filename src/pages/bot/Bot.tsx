import { Button, Card, DatePicker as DatePicker_, Form, Input, Switch, notification } from "antd";
import { useEffect, useState } from "react";
import { getAtomicSwapEther } from "../../common/ETH-HTLC";
import { getAccount } from "../../utils/web3";
import { ethers } from "ethers";
import dayjs from 'dayjs';

// const DatePicker = DatePicker_.generatePicker<Moment>(momentGenerateConfig);

export default function () {
    const [form] = Form.useForm<{
        addr: string,
        retiredAt: any,
        intro: string,
        bchPkh: string,
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
                    retiredAt: dayjs(marketMaker.retiredAt.toNumber()),
                    intro: ethers.utils.parseBytes32String(marketMaker.intro),
                    bchPkh: marketMaker.bchPkh,
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

    const onFinish = async () => {
        const values = form.getFieldsValue()
        try {
            const atomicSwapEther = await getAtomicSwapEther()
            const tx = await atomicSwapEther.registerMarketMaker(
                ethers.utils.formatBytes32String(values.intro), values.bchPkh,
                values.bchLockTime, values.sbchLockTime, values.penaltyBPS, values.feeBPS,
                ethers.utils.parseEther(values.minSwapAmt), ethers.utils.parseEther(values.maxSwapAmt),
                values.statusChecker
            )
            await tx.wait()
            form.setFieldsValue({ addr: await getAccount() })
            setHasCreated(true)
            notification.success({
                message: 'success',
                description: "Register pay"
            });
        } catch (error: any) {
            console.log(error)
            notification.error({
                message: 'error',
                description: error.message
            });
        }
    }

    const updateInfo = async () => {
        try {
            // update
            const atomicSwapEther = await getAtomicSwapEther()
            const tx = await atomicSwapEther.updateMarketMaker(ethers.utils.formatBytes32String(form.getFieldsValue().intro));
            await tx.wait()
            notification.success({
                message: 'success',
                description: "Update info success"
            });
        } catch (error: any) {
            console.log(error)
            notification.error({
                message: 'error',
                description: error.message
            });
        }
    }

    const retireMarketMaker = async () => {
        try {
            // update
            const atomicSwapEther = await getAtomicSwapEther()
            const tx = await atomicSwapEther.retireMarketMaker(form.getFieldsValue().retiredAt.unix().toString());
            await tx.wait()
            notification.success({
                message: 'success',
                description: "Retire success"
            });
        } catch (error: any) {
            console.log(error)
            notification.error({
                message: 'error',
                description: error.message
            });
        }
    }

    const [hasCreated, setHasCreated] = useState(false)

    const [unavailableForm] = Form.useForm<{
        marketMaker: string,
        b: string
    }>();
    const setUnavailable = async () => {
        const values = unavailableForm.getFieldsValue()
        try {
            const atomicSwapEther = await getAtomicSwapEther()
            const tx = await atomicSwapEther.setUnavailable(
                values.marketMaker, values.b
            )
            await tx.wait()
            notification.success({
                message: 'success',
                description: "setUnavailable success"
            });
        } catch (error: any) {
            console.log(error)
            notification.error({
                message: 'error',
                description: error.message
            });
        }
    }

    return (
        <div style={{ width: 1000, margin: "0 auto", marginTop: 50 }}>
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
                        <Input suffix={<Button disabled={!hasCreated} onClick={updateInfo}>Update</Button>} />
                    </Form.Item>
                    <Form.Item name="bchPkh" label="Bch Pkh"
                        rules={[{ required: true, message: 'bchPkh is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="bchLockTime" label="Bch LockTime(blocks)"
                        rules={[{ required: true, message: 'bchLockTime is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="sbchLockTime" label="Sbch LockTime(seconds)"
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
                    <Form.Item name="maxSwapAmt" label="Min swap amount"
                        rules={[{ required: true, message: 'maxSwapAmt is required' }]} >
                        <Input disabled={hasCreated} />
                    </Form.Item>
                    <Form.Item name="statusChecker" label="Status checker"
                        rules={[{ required: true, message: 'statusChecker is required' }]} >
                        <Input />
                    </Form.Item>
                    {!hasCreated && <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Create
                        </Button>
                    </Form.Item>}
                </Form >
            </Card>
            {hasCreated && <Card title="RetiredAt" bordered={false} >
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
            </Card>}

            <Card title="SetAvailable" bordered={false} >
                <Form
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
                    <Form.Item name="b" label="b"
                        rules={[{ required: true, message: 'b is required' }]} >
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