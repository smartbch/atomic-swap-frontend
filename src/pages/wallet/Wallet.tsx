import { QRCode } from "antd"
import bchaddr from 'bchaddrjs';
import { useEffect, useState } from "react";
import { getWalletClass } from "../../common/bch-wallet";
import { CopyOutlined } from '@ant-design/icons';
import { copyText } from "../../utils/operation";
import { useStore } from "../../common/store";

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

    if (!state.bchAccount) {
        return <div></div>
    }
    return <div style={{ width: 1000, margin: "0 auto", marginTop: 50, fontSize: 20 }}>
        <div>BchBalance:  {bchBalance}</div>
        <div style={{ marginTop: 20 }}>Derived Cash Address: {state.bchAccount}
            <CopyOutlined style={{ cursor: "pointer", fontSize: 20, marginLeft: 10 }} onClick={() => copyText(state.bchAccount)} />
        </div>
        <div>   <QRCode value={state.bchAccount} /></div>
        <div style={{ marginTop: 20 }}>Derived Legacy Address: {bchaddr.toLegacyAddress(state.bchAccount)}
            <CopyOutlined style={{ cursor: "pointer", fontSize: 20, marginLeft: 10 }} onClick={() => copyText(bchaddr.toLegacyAddress(state.bchAccount))} />
        </div>
        <div>   <QRCode value={bchaddr.toLegacyAddress(state.bchAccount)} /></div>
    </div>

}