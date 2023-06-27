import detectEthereumProvider from "@metamask/detect-provider";
import { BigNumber, constants, type ContractInterface, ethers, utils } from "ethers";

export async function connect() {
    if (typeof (window as any).ethereum === 'undefined') {
        if (typeof (window as any).web3 !== 'undefined') {
            (window as any).ethereum = (window as any).web3;
        } else if (typeof (window as any).TPJSBrigeClient !== 'undefined') {
            (window as any).ethereum = (window as any).TPJSBrigeClient;
        } else if (typeof (window as any).imToken !== 'undefined') {
            (window as any).ethereum = (window as any).imToken;
        } else {
            const provider = await detectEthereumProvider();
            if (provider) {
                (window as any).ethereum = provider;
            } {
                alert("Please open this page inside a mobile wallet App.");
            }
        }
    }
    (window as any).accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
    if ((window as any).accounts.length == 0) {
        (window as any)("Cannot connect to wallet");
        return false;
    }
    return true;
}

export function getProvider() {
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    return provider
}

export function getSigner() {
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    return provider.getSigner()
}

export async function getAccount(): Promise<string> {
    try {
        const provider = new ethers.providers.Web3Provider((window as any).ethereum);
        return await provider.getSigner().getAddress()
    } catch (error) {
        return null as any
    }
}

export function getContract(addressOrName: string, contractInterface: ContractInterface) {
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const signer = provider.getSigner()
    return new ethers.Contract(addressOrName, contractInterface, provider).connect(signer)
}

export async function approve(tokenAddr: string, spenderAddr: string, amount = constants.MaxUint256) {
    const SEP20ABI = [
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address account) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
    ]
    const tokenContract = await getContract(tokenAddr, SEP20ABI)
    return tokenContract.approve(spenderAddr, amount)
}

export async function getAllowance(tokenAddr: string, ownerAddr: string, spenderAddr: string): Promise<BigNumber> {
    const SEP20ABI = [
        "function allowance(address owner, address spender) external view returns (uint256)",
    ]
    const tokenContract = await getContract(tokenAddr, SEP20ABI)
    return tokenContract.allowance(ownerAddr, spenderAddr)
}


export async function setupNetwork(chain: any) {
    const provider = (window as any).ethereum;
    if (!provider) {
        throw new Error("Can't setup the network on metamask because window.ethereum is undefined")
    }
    const chainId = `0x${(chain.chainId).toString(16)}`;
    try {
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }],
        });
    } catch (switchError: any) {
        if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
            try {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId,
                            chainName: chain.chainName,
                            nativeCurrency: chain.nativeCurrency,
                            rpcUrls: chain.rpcUrls,
                            blockExplorerUrls: chain.blockExplorerUrls,
                        },
                    ],
                })
            } catch (error: any) {
                throw new Error(`Failed to setup the network in Metamask: ${error.message}`)
            }
        } else {
            throw switchError
        }
    }
    const chainId_ = await provider.request({
        method: 'eth_chainId',
        params: [],
    })
    console.log(chainId_)
    if (chainId_ !== chainId) {
        throw new Error(`Failed to setup the network in Metamask`)
    }
    return true
}
