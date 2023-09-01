const config = {
    MAINNET: process.env.REACT_APP_MAINNET === "true",
    AtomicSwapEther_Address: ''
}
config.AtomicSwapEther_Address = config.MAINNET ? "0x4dec1a09269DaDbAfBDBAF34A4cc224eCC1Bdc42" : "0x911F3537aab6EAe5080A5A8487F8f67C95C7aDDC"

export default config
