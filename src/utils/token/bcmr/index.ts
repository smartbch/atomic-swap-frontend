import Tokens1 from "./bcmr.json"
(Tokens1 as any)["f43b5b16c8540c90923abcea4e215167b8d9328c15cb33fa73514d88e933ac0f"] = {
    "decimals": 2,
    "symbol": "TEST"
}

const bcmrTokens2 = Object.entries(Tokens1).map(([key, { symbol, decimals }]: any) => ({ symbol, decimals: decimals, category: key, name: `BCMR-${symbol}` }))
export const BCMR_Tokens = bcmrTokens2
