const config = {
    MAINNET: process.env.REACT_APP_MAINNET === "true",
    AtomicSwapEther_Address: ''
}
config.AtomicSwapEther_Address = config.MAINNET ? "0xBa26D85Bef070Ed2C6B0D555aAAc1c54611ECd22" : "0x15a7FC93dA3d2eb0ce5E2224549AD3F880869d68"

export default config
