import { create } from 'zustand'

interface Store {
    bchAccount: string,
    account: string,
    chainId: number,
}

const useStore0 = create<{ state: Store, setStoreItem: (payload: Partial<Store>) => void }>((set) => ({
    state: {} as Store,
    setStoreItem: (payload: Partial<Store>) => set((state: any) => {
        return { state: { ...state.state, ...payload } } as any
    }),
}))

export const useStore = () => {
    const store = useStore0()
    return store
}