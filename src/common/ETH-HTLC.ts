import { ethers } from "ethers";
import CONFIG from "../CONFIG";
import { getContract } from "../utils/web3";
const ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "_secretLock",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "_secretKey",
				"type": "bytes32"
			}
		],
		"name": "Close",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "_secretLock",
				"type": "bytes32"
			}
		],
		"name": "Expire",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "_depositTrader",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "_withdrawTrader",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "_secretLock",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_unlockTime",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_value",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes20",
				"name": "_bchWithdrawPKH",
				"type": "bytes20"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_createdTime",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint16",
				"name": "_penaltyBPS",
				"type": "uint16"
			}
		],
		"name": "Open",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_secretLock",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "_secretKey",
				"type": "bytes32"
			}
		],
		"name": "close",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_secretLock",
				"type": "bytes32"
			}
		],
		"name": "expire",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "marketMakerAddrs",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "marketMakers",
		"outputs": [
			{
				"internalType": "address",
				"name": "addr",
				"type": "address"
			},
			{
				"internalType": "uint64",
				"name": "retiredAt",
				"type": "uint64"
			},
			{
				"internalType": "bytes32",
				"name": "intro",
				"type": "bytes32"
			},
			{
				"internalType": "bytes20",
				"name": "bchPkh",
				"type": "bytes20"
			},
			{
				"internalType": "uint16",
				"name": "bchLockTime",
				"type": "uint16"
			},
			{
				"internalType": "uint32",
				"name": "sbchLockTime",
				"type": "uint32"
			},
			{
				"internalType": "uint16",
				"name": "penaltyBPS",
				"type": "uint16"
			},
			{
				"internalType": "uint16",
				"name": "feeBPS",
				"type": "uint16"
			},
			{
				"internalType": "uint256",
				"name": "minSwapAmt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxSwapAmt",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "statusChecker",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "unavailable",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_withdrawTrader",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "_secretLock",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "_validPeriod",
				"type": "uint256"
			},
			{
				"internalType": "bytes20",
				"name": "_bchWithdrawPKH",
				"type": "bytes20"
			},
			{
				"internalType": "uint16",
				"name": "_penaltyBPS",
				"type": "uint16"
			}
		],
		"name": "open",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_intro",
				"type": "bytes32"
			},
			{
				"internalType": "bytes20",
				"name": "_bchPkh",
				"type": "bytes20"
			},
			{
				"internalType": "uint16",
				"name": "_bchLockTime",
				"type": "uint16"
			},
			{
				"internalType": "uint32",
				"name": "_sbchLockTime",
				"type": "uint32"
			},
			{
				"internalType": "uint16",
				"name": "_penaltyBPS",
				"type": "uint16"
			},
			{
				"internalType": "uint16",
				"name": "_feeBPS",
				"type": "uint16"
			},
			{
				"internalType": "uint256",
				"name": "_minSwapAmt",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_maxSwapAmt",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_statusChecker",
				"type": "address"
			}
		],
		"name": "registerMarketMaker",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_delay",
				"type": "uint256"
			}
		],
		"name": "retireMarketMaker",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "secretLocks",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "marketMaker",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "b",
				"type": "bool"
			}
		],
		"name": "setUnavailable",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "swaps",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "timelock",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			},
			{
				"internalType": "address payable",
				"name": "ethTrader",
				"type": "address"
			},
			{
				"internalType": "address payable",
				"name": "withdrawTrader",
				"type": "address"
			},
			{
				"internalType": "bytes20",
				"name": "bchWithdrawPKH",
				"type": "bytes20"
			},
			{
				"internalType": "uint16",
				"name": "penaltyBPS",
				"type": "uint16"
			},
			{
				"internalType": "enum AtomicSwapEther.States",
				"name": "state",
				"type": "uint8"
			},
			{
				"internalType": "bytes32",
				"name": "secretKey",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_intro",
				"type": "bytes32"
			}
		],
		"name": "updateMarketMaker",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

export async function getAtomicSwapEther() {
    return await getContract(CONFIG.AtomicSwapEther_Address, ABI)
}

export interface MarketMaker {
    addr: string
    intro: string
    bchPkh: string
    bchLockTime: number
    sbchLockTime: number
    penaltyBPS: number
    feeBPS: number
    minSwapAmt: string
    maxSwapAmt: string
}


export async function getMarketMakers(): Promise<MarketMaker[]> {
    const htlc = await getAtomicSwapEther()
    const bots = [];
    for (let i = 0; ; i++) {
        try {
            const marketMakerAddr = await htlc.marketMakerAddrs(i);
            const { addr, intro, bchPkh, bchLockTime, sbchLockTime, penaltyBPS, feeBPS, minSwapAmt, maxSwapAmt } = await htlc.marketMakers(marketMakerAddr);
            // bots.push({
            //     addr, intro: ethers.utils.parseBytes32String(intro), bchPkh, bchLockTime, sbchLockTime, penaltyBPS, feeBPS,
            //     minSwapAmt: ethers.utils.formatEther(minSwapAmt.toString()).toString(), maxSwapAmt: ethers.utils.formatEther(maxSwapAmt.toString()).toString()
            // });

            bots.push({
                addr, intro: ethers.utils.parseBytes32String(intro), bchPkh, bchLockTime: 6, sbchLockTime: 3600, penaltyBPS, feeBPS,
                minSwapAmt: parseFloat(ethers.utils.formatEther(minSwapAmt.toString()).toString()), maxSwapAmt: parseFloat(ethers.utils.formatEther(maxSwapAmt.toString()).toString())
            }); // debug
        } catch (err) {
            break;
        }
    }
    console.log(bots)
    return bots as any
}