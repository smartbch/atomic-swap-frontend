import { error } from "console"
import { useState, useEffect, useCallback } from "react"


export function useStore<T>(): [T, (data: Partial<T>) => void] {
    const [store, setStore] = useState<T>({} as any)
    const setStoreItem = useCallback(
        (data: Record<string, any>) => {
            const newData = { ...store, ...data }
            console.log("newData", newData)
            setStore(newData)
        },
        [store],
    );
    return [store, setStoreItem]
}



let gloadStore_: any = {}
interface GloadStore {
    bchAccount: string,
    account: string,
    chainId: number,
}
export function useGloabalStore(): [GloadStore, (data: Partial<GloadStore>) => void] {
    const [gloabalStore, setStore] = useState(gloadStore_)
    const setGloabalStoreStoreItem =
        (data: Record<string, any>) => {
            gloadStore_ = { ...gloadStore_, ...data }
            setStore(gloadStore_)
        }
    useEffect(() => {
        setTimeout(() => {
            setStore(gloadStore_)
        }, 500);
        // console.log(3, gloadStore_)
        // setStore(gloadStore_)
    }, [gloadStore_])
    return [gloabalStore, setGloabalStoreStoreItem]
}