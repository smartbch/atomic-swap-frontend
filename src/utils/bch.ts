import { BigNumber } from "bignumber.js"
import { parseUnits } from "./precision"
import { ethers } from "ethers"

export function bch2Satoshis(amount: any) {
    return BigNumber(parseUnits(amount.toString(), 18)).multipliedBy(100000000).div(ethers.constants.WeiPerEther.toString()).integerValue(BigNumber.ROUND_CEIL).toFixed(0)
  }
  
  export function satoshis2Bch(amount: any) {
    return BigNumber(amount).div(10 ** 8).toString()
  }