import { ethers } from "ethers";
import CONFIG from "../CONFIG";
import { getContract, getProvider } from "../utils/web3";

const ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "minStakedValue",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minRetireDelay",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "_sender",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "_receiver",
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
				"name": "_receiverBchPkh",
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
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_expectedPrice",
				"type": "uint256"
			}
		],
		"name": "Lock",
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
		"name": "Refund",
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
			},
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "_secretKey",
				"type": "bytes32"
			}
		],
		"name": "Unlock",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "MIN_RETIRE_DELAY",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MIN_STAKED_VALUE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "fromIdx",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "count",
				"type": "uint256"
			}
		],
		"name": "getMarketMakers",
		"outputs": [
			{
				"components": [
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
						"internalType": "uint256",
						"name": "bchPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "sbchPrice",
						"type": "uint256"
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
						"internalType": "uint256",
						"name": "stakedValue",
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
				"internalType": "struct AtomicSwapEther.MarketMaker[]",
				"name": "list",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "secretLock",
				"type": "bytes32"
			}
		],
		"name": "getSwapState",
		"outputs": [
			{
				"internalType": "enum AtomicSwapEther.States",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "_receiver",
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
				"name": "_receiverBchPkh",
				"type": "bytes20"
			},
			{
				"internalType": "uint16",
				"name": "_penaltyBPS",
				"type": "uint16"
			},
			{
				"internalType": "bool",
				"name": "_receiverIsMM",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "_expectedPrice",
				"type": "uint256"
			}
		],
		"name": "lock",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "addr",
				"type": "address"
			}
		],
		"name": "marketMakerByAddress",
		"outputs": [
			{
				"components": [
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
						"internalType": "uint256",
						"name": "bchPrice",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "sbchPrice",
						"type": "uint256"
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
						"internalType": "uint256",
						"name": "stakedValue",
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
				"internalType": "struct AtomicSwapEther.MarketMaker",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "_secretLock",
				"type": "bytes32"
			}
		],
		"name": "refund",
		"outputs": [],
		"stateMutability": "nonpayable",
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
				"internalType": "uint16",
				"name": "_penaltyBPS",
				"type": "uint16"
			},
			{
				"internalType": "uint256",
				"name": "_bchPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_sbchPrice",
				"type": "uint256"
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
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "retireMarketMaker",
		"outputs": [],
		"stateMutability": "nonpayable",
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
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "swaps",
		"outputs": [
			{
				"internalType": "bool",
				"name": "receiverIsMM",
				"type": "bool"
			},
			{
				"internalType": "uint64",
				"name": "startTime",
				"type": "uint64"
			},
			{
				"internalType": "uint64",
				"name": "startHeight",
				"type": "uint64"
			},
			{
				"internalType": "uint32",
				"name": "validPeriod",
				"type": "uint32"
			},
			{
				"internalType": "address payable",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address payable",
				"name": "receiver",
				"type": "address"
			},
			{
				"internalType": "uint96",
				"name": "value",
				"type": "uint96"
			},
			{
				"internalType": "bytes20",
				"name": "receiverBchPkh",
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
			},
			{
				"internalType": "uint256",
				"name": "expectedPrice",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
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
		"name": "unlock",
		"outputs": [],
		"stateMutability": "nonpayable",
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
				"internalType": "uint256",
				"name": "_bchPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_sbchPrice",
				"type": "uint256"
			}
		],
		"name": "updateMarketMaker",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawStakedValue",
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
	bchPrice: string
	sbchPrice: string
	bchPkh: string
	bchLockTime: number
	sbchLockTime: number
	penaltyBPS: number
	minSwapAmt: string
	maxSwapAmt: string
	stakedValue: string
}


export async function getMarketMakers(): Promise<MarketMaker[]> {
	const atomicSwapEther = await getAtomicSwapEther()
	let makers = await atomicSwapEther.getMarketMakers(0, 100)
	makers = makers.filter((v: any) => !v.unavailable && v.retiredAt.toNumber() < new Date().getTime())
	return makers.map(({ stakedValue, addr, intro, bchPrice, sbchPrice, bchPkh, bchLockTime, sbchLockTime, penaltyBPS, minSwapAmt, maxSwapAmt, retiredAt, statusChecker }: any) => ({
		addr,
		intro: ethers.utils.parseBytes32String(intro),
		bchPkh, bchLockTime, sbchLockTime,
		penaltyBPS,
		bchPrice: ethers.utils.formatEther(bchPrice.toString()).toString(),
		sbchPrice: ethers.utils.formatEther(sbchPrice.toString()).toString(),
		retiredAt: retiredAt.toNumber(),
		minSwapAmt: ethers.utils.formatEther(minSwapAmt.toString()).toString(), maxSwapAmt: ethers.utils.formatEther(maxSwapAmt.toString()).toString(), statusChecker,
		stakedValue: stakedValue.toString()
	}))
}

export async function getPendingBalance(address: string) {
	const atomicSwapEther = await getAtomicSwapEther()
	const lockFilter = atomicSwapEther.filters.Lock(null, address);
	const refundFilter = atomicSwapEther.filters.Refund();
	const unlockFilter = atomicSwapEther.filters.Unlock();
	const [lockData, refundData, unlockData] = await Promise.all([
		lockFilter, refundFilter, unlockFilter]
		.map(filter => atomicSwapEther.queryFilter(filter, -7200, "latest")
			.then(res => res.map(v => v.args!)))
	)
	const notHandleData = lockData.filter(({ _secretLock }: any) => !refundData.some(r => r!._secretLock === _secretLock) && !unlockData.some(r => r!._secretLock === _secretLock))
	const pendingValue = notHandleData.map(v => v._value).reduce((x, y) => x.add(y), ethers.constants.Zero)
	return ethers.utils.formatEther(pendingValue)
}