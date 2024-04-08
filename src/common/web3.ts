import { ethers } from "ethers"
import { getProvider, setupNetwork } from "../utils/web3"
import CONFIG from "./../CONFIG"

export async function setupSmartBCHNetwork() {
    const chain = CONFIG.MAINNET ?
        {
            chainName: "smartBCH",
            chainId: 10000,
            nativeCurrency: {
                name: 'BCH',
                symbol: 'bch',
                decimals: 18,
            },
            rpcUrls: ["https://rpc.smartbch.org"],
            blockExplorerUrls: [`https://www.smartscout.cash/`],
        } :
        {
            chainName: "smartBCH",
            chainId: 10001,
            nativeCurrency: {
                name: 'BCH',
                symbol: 'bch',
                decimals: 18,
            },
            rpcUrls: ["https://rpc-testnet.smartbch.org"],
            blockExplorerUrls: [`https://www.smartscout.cash/`],
        }
    return await setupNetwork(chain)
}