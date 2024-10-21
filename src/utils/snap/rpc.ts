import config from "../../CONFIG";

declare global {
    interface Window {
        ethereum: any;
    }
}

export type NetWork = "mainnet" | "testnet"

const snapRpcRequest = async (snapId: string, args: any,) => {
    const result = await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
            snapId: snapId,
            request: {
                method: `bch_${args.snapRpcMethod}`,
                params: 'params' in args ? args.params : undefined,
            },
        },
    });

    return result
};

export const getAddress = async (snapId: string) => {
    return await snapRpcRequest(snapId, {
        snapRpcMethod: 'getAddress',
        params: {
            network: config.MAINNET ? "mainnet" : "testnet",
        },
    });
};

export const getPublicKey = async (snapId: string) => {
    return await snapRpcRequest(snapId, {
        snapRpcMethod: 'getPublicKey',
        params: {
            network: config.MAINNET ? "mainnet" : "testnet",
        },
    });
};


export const signTransaction = async (snapId: string, unsignedTx: string) => {
    return snapRpcRequest(snapId, {
        snapRpcMethod: 'signTransaction',
        params: {
            network: config.MAINNET ? "mainnet" : "testnet",
            unsignedTx
        },
    });
};

export const signTransactionForArg = async (snapId: string, unsignedTx: string) => {
    return snapRpcRequest(snapId, {
        snapRpcMethod: 'signTransactionForArg',
        params: {
            network: config.MAINNET ? "mainnet" : "testnet",
            unsignedTx
        },
    });
};
