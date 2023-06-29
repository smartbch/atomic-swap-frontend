import { Button, Form, InputNumber, Modal, QRCode } from "antd"
import bchaddr from 'bchaddrjs';
import { useEffect, useState } from "react";
import { getWalletClass } from "../../common/bch-wallet";
import { CopyOutlined } from '@ant-design/icons';
import { copyText, showLoading, wrapOperation } from "../../utils/operation";
import { useStore } from "../../common/store";
import { SendRequest } from "mainnet-js";
import { createUnsignedTx } from "../../lib/common";
import { signTx } from "../../lib/pay4best";
import { hexToBin } from '@bitauth/libauth';
import TextArea from "antd/es/input/TextArea";
import { bch2Satoshis } from "../../utils/utils";

export default function () {
    const [bchBalance, setBchBalance] = useState<string>('')
    const { state, setStoreItem } = useStore()

    useEffect(() => {
        const fetch = async () => {
            if (!state.bchAccount) {
                return
            }
            const wallet = await getWalletClass().fromCashaddr(state.bchAccount)
            setBchBalance(await wallet.getBalance('bch') as any)
        }
        fetch()
    }, [state.bchAccount])

    const [form] = Form.useForm<{ visible: boolean, addr: string, amount: number }>();
    const transferBCH = wrapOperation(async () => {
        const values = form.getFieldsValue()
        let toAddrList = values.addr.trim().split(/(\s+)/);
        toAddrList = toAddrList.map(v => {
            if (v.trim().length == 0) {
                return ''
            }
            if (bchaddr.isLegacyAddress(v)) {
                return bchaddr.toCashAddress(v)
            }
            if (!v.startsWith("bitcoincash:") && !v.startsWith("bchtest:")) {
                v = "bitcoincash:" + v;
            }
            return v
        }).filter(v => v)
        const amount = bch2Satoshis(values.amount)
        const reqList = toAddrList.map(v => new SendRequest({
            cashaddr: v,
            value: Number(amount),
            unit: 'sat',
        }))
        showLoading()
        const wallet = await getWalletClass().fromCashaddr(state.bchAccount)
        const unSignedTx = await createUnsignedTx(wallet, reqList, false, { buildUnsigned: true });
        const signedTx = await signTx(unSignedTx);
        await wallet.submitTransaction(hexToBin(signedTx))
        form.resetFields()
        setStoreItem({})
    })

    if (!state.bchAccount) {
        return <div></div>
    }
    console.log(form.getFieldsValue().visible)
    return <div style={{ width: 1000, margin: "0 auto", marginTop: 50, fontSize: 20 }}>
        <div>BchBalance:  {bchBalance} <Button type="primary" style={{ marginLeft: 20 }} onClick={() => { form.setFieldsValue({ visible: true }); setStoreItem({}) }}>Send</Button></div>
        <div style={{ marginTop: 20 }}>Derived Cash Address: {state.bchAccount}
            <CopyOutlined style={{ cursor: "pointer", fontSize: 20, marginLeft: 10 }} onClick={() => copyText(state.bchAccount)} />
        </div>
        <div>   <QRCode value={state.bchAccount} /></div>
        <div style={{ marginTop: 20 }}>Derived Legacy Address: {bchaddr.toLegacyAddress(state.bchAccount)}
            <CopyOutlined style={{ cursor: "pointer", fontSize: 20, marginLeft: 10 }} onClick={() => copyText(bchaddr.toLegacyAddress(state.bchAccount))} />
        </div>
        <div>   <QRCode value={bchaddr.toLegacyAddress(state.bchAccount)} /></div>


        <Form style={{ display: "none" }} form={form}> <Form.Item name="visible" rules={[{ required: true }]}></Form.Item>  </Form>
        <Modal title="Send BCH" destroyOnClose open={form.getFieldsValue().visible} onOk={transferBCH} onCancel={() => { form.setFieldsValue({ visible: false });; setStoreItem({}) }}>
            <Form
                form={form}
                name="basic"
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
                style={{ maxWidth: 600, margin: "0 auto" }}
                autoComplete="off"
            >
                <Form.Item label="Address" name="addr" rules={[{ required: true }]}>
                    <TextArea placeholder="The address list is separated by spaces" autoSize={{ minRows: 2, maxRows: 6 }} />
                </Form.Item>
                <Form.Item label="Amount" name="amount" rules={[{ required: true }]}>
                    <InputNumber style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Modal>
    </div>

}