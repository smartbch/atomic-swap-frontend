import { Button, Card, Form, Input, Switch, notification } from "antd";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import CONFIG from "../../../CONFIG";
import { getAtomicSwapEther } from "../../../common/ETH-HTLC";
import { pkhToCashAddr, cashAddrToPkh } from "../../../lib/common";
import { wrapOperation, showLoading } from "../../../utils/operation";
import { getAccount } from "../../../utils/web3";

export default function () {
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

    return (<div style={{ width: 600, margin: "0 auto", marginTop: 20 }}><Form
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
    </Form></div>)
}