export function pack(tx: any) {
    return JSON.stringify(tx, (_, value) => typeof value === "bigint" ? `${value.toString()}` : value)
}

export function unPack(txStr: string) {
    return JSON.parse(txStr, function (key, value) {
        if (!!value && typeof value === "object") {
            const keys = Object.keys(value)
            const values = Object.values(value)

            const b = keys.every((v: any) => typeof Number(v) === "number") && values.every((v: any) => typeof v === "number")
            if (!b) {
                return value
            }
            return new Uint8Array(values as any);
        }
        if (["token", "nft"].includes(key) && value === null) {
            return undefined
        }
        if (["valueSatoshis", "amount"].includes(key)) {
            return BigInt(value)
        }
        return value;
    })
}