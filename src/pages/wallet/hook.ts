import { useCallback, useEffect, useState } from "react";
import { getWalletClass } from "../../common/bch-wallet";

export const useBalance = (address: string) => {
    const [balance, setBalance] = useState("");

    const refreshBalance = useCallback(async () => {
        if (!address) {
            setBalance("")
            return
        }
        const wallet = await getWalletClass().fromCashaddr(address)
        setBalance(await wallet.getBalance('bch') as any)
    }, [address])

    useEffect(() => {
        refreshBalance()
    }, [address]);

    return { balance, refreshBalance };
};