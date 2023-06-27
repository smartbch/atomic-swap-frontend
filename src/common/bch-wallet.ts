import { TestNetWallet, Wallet } from "mainnet-js";
import CONFIG from "../CONFIG";

let _Wallet: any;
export function getWalletClass(): typeof Wallet {
    if (_Wallet) {
        return _Wallet
    }
    if (CONFIG.MAINNET) {
        _Wallet = Wallet
    } else {
        // DefaultProvider.servers.testnet = ["wss://blackie.c3-soft.com:60004"]
        _Wallet = TestNetWallet;
    }
    return _Wallet
}
