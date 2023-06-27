import { QRCode } from "antd"
import { useGloabalStore } from "../../common/store"
import bchaddr from 'bchaddrjs';
import { useEffect, useState } from "react";
import { getWalletClass } from "../../common/bch-wallet";


export default function () {
    const [gloabalStore, setGloabalStoreStoreItem] = useGloabalStore()
    const [bchBalance, setBchBalance] = useState<string>('')
    useEffect(() => {
        const fetch = async () => {
            if (!gloabalStore.bchAccount) {
                return
            }
            const wallet = await getWalletClass().fromCashaddr(gloabalStore.bchAccount)
            setBchBalance(await wallet.getBalance('bch') as any)
        }
        fetch()
    }, [gloabalStore.bchAccount])

    if (!gloabalStore.bchAccount) {
        return <div></div>
    }
    return <div>
        <div>Derived Cash Address:</div>
        <div>   <QRCode value={gloabalStore.bchAccount} />{gloabalStore.bchAccount}</div>
        <div>Derived Legacy Address:</div>
        <div>   <QRCode value={bchaddr.toLegacyAddress(gloabalStore.bchAccount)} />{bchaddr.toLegacyAddress(gloabalStore.bchAccount)}</div>
        <div>bchBalance:</div>{bchBalance}
    </div>

}