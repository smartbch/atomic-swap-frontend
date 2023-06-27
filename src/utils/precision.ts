import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";

export default function toPrecision(amount: any, num: number): string {
    const BN = BigNumber.clone();
    // 重新制定小数位数，不使用科学计数法
    BN.config({ EXPONENTIAL_AT: [-30, 30] })
    let tranVal = "";
    let float = "";
    const str = amount.toString().split('.');
    if (str[1]) {
        float = (new BN(`0.${str[1]}`).sd(num, BN.ROUND_DOWN)).toString();
        if (float === '1') {
            tranVal += new BN(`${str[0]}`).plus(new BN(`${float}`)).toFixed();
        } else {
            tranVal += `${str[0]}.${float.split("0.")[1]}`;
        }
        return tranVal;
    }
    return amount.toString();

}


export function formatUnits(value: string | number, unitName: string | number) {
    if (!unitName) {
        return value.toString()
    }
    // console.log(toPrecision('0.0000000000052928', 10))
    // return toPrecision(ethers.utils.formatUnits(value, unitName).toString(), 2)
    return new BigNumber(value).div(10 ** Number(unitName)).toFixed()
}

export function parseUnits(value: string | number, unitName: string | number) {
    return new BigNumber(value).multipliedBy(10 ** Number(unitName)).toFixed(0)
}