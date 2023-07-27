const config = {
    MAINNET: process.env.REACT_APP_MAINNET === "true",
    AtomicSwapEther_Address: ''
}
config.AtomicSwapEther_Address = config.MAINNET ? "0x4dec1a09269DaDbAfBDBAF34A4cc224eCC1Bdc42" : "0x38C3DDBDc5a90Ee7D1BB4788a651f1ab15002d79"

export default config
