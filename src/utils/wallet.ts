import { hexToBin, Wallet } from "mainnet-js";
import { signTransaction } from "./snap/rpc";
import { pack as snapPack } from "./snap/serialize";
import { broadcastTx as _broadcastTx } from "./../lib/pay4best";

export async function broadcastTx(wallet: Wallet, snapId: string, tx: any) {
    // snap
    if (snapId) {
        const signedTxHex = await signTransaction(snapId, snapPack(tx))
        const txId = await wallet.submitTransaction(hexToBin(signedTxHex))
        console.log("txId: ", txId)
        return txId
    }

    // pay4best
    return await _broadcastTx(wallet, tx)
}