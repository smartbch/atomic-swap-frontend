import { type CRCToken, getTokenByCategory as _getTokenByCategory, getTokensBySymbol as _getTokensBySymbol } from "libcrc721";
import { findToken, insertTokensToIndexeDB } from "./db";
import {BCMR_Tokens} from "./bcmr";
import { satoshis2Bch } from "../bch";
import { formatUnits } from "../precision";

export async function getTokenByCategory(category: string): Promise<CRCToken | null> {
    const found = await findToken({ category: category })
    if (found) {
        return found
    }

    const token: any = await _getTokenByCategory(category)
    if (token) {
        if (typeof token.isCanonical === "boolean") {
            await insertTokensToIndexeDB([token])
        }
        return token
    }
    // support bcmr
    return BCMR_Tokens.find(v => v.category === category) as any
}

export async function getTokensBySymbol(symbol: string): Promise<CRCToken[]> {
    let result: any = await _getTokensBySymbol(symbol);
    // support bcmr
    for (const entry of BCMR_Tokens) {
        if (entry.symbol == symbol && !result.find((v: any) => v.category === entry.category)) {
            result.push(entry);
        }
    }
    return result
}

export async function getPayText(amount: string | number, category?: string) {
    if (!category) {
        return `${satoshis2Bch(amount)}  BCH`
    }
    const token = await getTokenByCategory(category)
    return `${formatUnits(amount!, token!.decimals)}  ${token!.symbol}`
}


export function getCanonicalText(token: CRCToken) {
    if (token?.isCanonical === true) {
        return "YES"
    }
    if (token?.isCanonical === false) {
        return "NO"
    }
    return "-"
}

export function getCanonicalPrefixSymbol(token: CRCToken) {
    if (token?.isCanonical === true) {
        return "canonical:" + token.symbol
    }
    return token.symbol
}
