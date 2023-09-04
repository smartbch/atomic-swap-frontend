const config = {
    MAINNET: process.env.REACT_APP_MAINNET === "true",
    AtomicSwapEther_Address: ''
}
config.AtomicSwapEther_Address = config.MAINNET ? "0x4dec1a09269DaDbAfBDBAF34A4cc224eCC1Bdc42" : "0x15a7FC93dA3d2eb0ce5E2224549AD3F880869d68"

export default config
