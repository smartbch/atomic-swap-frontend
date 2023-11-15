import { Network, Wallet } from "mainnet-js";
import { decode, encode } from "algo-msgpack-with-bigint";
import config from "../CONFIG";

export async function getBCHAccount(): Promise<string> {
    console.log('getBCHAccount...');
    const account: any = await new Promise((r, _) => {
        const getAccount = () => {
            const walletFrame: any = document.getElementById('walletFrame');
            const addrChannel = new MessageChannel();
            addrChannel.port2.onmessage = function (e) {
                if (e.data === 'wallet-not-init') {
                    setTimeout(() => {
                        getAccount()
                    }, 1000);
                } else {
                    r(e.data)
                }
            }
            walletFrame.contentWindow.postMessage({
                Pay4BestWalletReq: {
                    GetAddr: true,
                }
            }, '*', [addrChannel.port1]);
        }

        getAccount()
    })
    return account
}

export async function getEVMAddress(): Promise<string> {
    console.log('getBCHAccount...');
    const account: any = await new Promise((r, reject) => {
        const getAccount = () => {
            const walletFrame: any = document.getElementById('walletFrame');
            const addrChannel = new MessageChannel();
            addrChannel.port2.onmessage = function (e) {
                if (e.data === 'GetEvmAddr-error') {
                    reject("GetEvmAddr-error")
                    return
                }
                r(e.data)
            }
            walletFrame.contentWindow.postMessage({
                Pay4BestWalletReq: {
                    GetEvmAddr: true,
                }
            }, '*', [addrChannel.port1]);
        }

        getAccount()
    })
    return account
}

function pack(tx: any) {
    return base64EncodeURL(encode(tx))
}

function base64EncodeURL(byteArray: Uint8Array) {
    return btoa(Array.from(new Uint8Array(byteArray)).map(val => {
        return String.fromCharCode(val);
    }).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}

export async function broadcastTx(wallet: Wallet, tx: any) {
    let pay4BestWindow
    const href = `${config.PAY4BEST_URL}?broadcasttx=${pack(tx)}&testnet=${wallet.network === Network.TESTNET ? "true" : ''}`
    pay4BestWindow = window.open(href);
    if (!pay4BestWindow) {
        let a = document.createElement('a');
        a.target = "_blank"
        a.href = href
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click()
        a.remove()
    }


    const txs = await wallet.provider!.performRequest("blockchain.address.get_history", wallet.address!)
    const txOldIds: string[] = txs.map((x: any) => x.tx_hash)
    for (let index = 0; index < 60; index++) {
        await new Promise((r, _) => setTimeout(r, 1000))
        const txs = await wallet.provider!.performRequest("blockchain.address.get_history", wallet.address!)
        const txNewIds: string[] = txs.map((x: any) => x.tx_hash)
        let newTxid = (txNewIds as any).findLast((id: string) => !txOldIds.includes(id))
        if (newTxid) {
            pay4BestWindow?.close()
            console.log("txId: ", newTxid)
            return newTxid
        }
        if (pay4BestWindow && pay4BestWindow.window === null) {
            throw new Error("You refused to sign.")
        }
    }
    throw new Error("User cancel operation.")
}