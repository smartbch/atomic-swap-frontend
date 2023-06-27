import { Button, Form, Input, Switch, notification } from "antd";
import { useEffect, useState } from "react";
import { getAtomicSwapEther } from "../../common/ETH-HTLC";
import { getAccount } from "../../utils/web3";
import { ethers } from "ethers";

export default function () {
    const [form] = Form.useForm<{
        addr: string,
        retiredAt: string,
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
                    retiredAt: marketMaker.retiredAt,
                    intro: ethers.utils.parseBytes32String(marketMaker.intro),
                    bchPkh: marketMaker.bchPkh,
                    bchLockTime: marketMaker.bchLockTime,
                    sbchLockTime: marketMaker.sbchLockTime,
                    penaltyBPS: marketMaker.penaltyBPS,
                    feeBPS: marketMaker.feeBPS,
                    minSwapAmt: marketMaker.minSwapAmt.toString(),
                    maxSwapAmt: marketMaker.maxSwapAmt.toString(),
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
            const tx = await atomicSwapEther.retireMarketMaker(form.getFieldsValue().retiredAt);
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
        <div>
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
                {hasCreated && <Form.Item name="retiredAt" label="RetiredAt"
                    rules={[{ required: true, message: 'retiredAt is required' }]} >
                    <Input suffix={<Button disabled={!hasCreated} onClick={retireMarketMaker}>Retire</Button>} />
                </Form.Item>}
                <Form.Item name="bchPkh" label="BchPkh"
                    rules={[{ required: true, message: 'bchPkh is required' }]} >
                    <Input disabled={hasCreated} />
                </Form.Item>
                <Form.Item name="bchLockTime" label="BchLockTime"
                    rules={[{ required: true, message: 'bchLockTime is required' }]} >
                    <Input disabled={hasCreated} />
                </Form.Item>
                <Form.Item name="sbchLockTime" label="SbchLockTime"
                    rules={[{ required: true, message: 'sbchLockTime is required' }]} >
                    <Input disabled={hasCreated} />
                </Form.Item>
                <Form.Item name="penaltyBPS" label="Penalty(%)"
                    rules={[{ required: true, message: 'penaltyBPS is required' }]} >
                    <Input disabled={hasCreated} />
                </Form.Item>
                <Form.Item name="feeBPS" label="FeeBPS(%)"
                    rules={[{ required: true, message: 'feeBPS is required' }]} >
                    <Input disabled={hasCreated} />
                </Form.Item>
                <Form.Item name="minSwapAmt" label="MinSwapAmt"
                    rules={[{ required: true, message: 'minSwapAmt is required' }]} >
                    <Input disabled={hasCreated} />
                </Form.Item>
                <Form.Item name="maxSwapAmt" label="MaxSwapAmt"
                    rules={[{ required: true, message: 'maxSwapAmt is required' }]} >
                    <Input disabled={hasCreated} />
                </Form.Item>
                <Form.Item name="statusChecker" label="StatusChecker"
                    rules={[{ required: true, message: 'statusChecker is required' }]} >
                    <Input />
                </Form.Item>
                {!hasCreated && <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>}
            </Form >

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
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </div>)
}