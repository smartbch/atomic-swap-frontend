const config = {
    MAINNET: process.env.REACT_APP_MAINNET === "true",
    AtomicSwapEther_Address: ''
}
config.AtomicSwapEther_Address = config.MAINNET ? "0x514a59AfDa01fc3553eb9F2c501216A6CAe04fe6" : "0x514a59AfDa01fc3553eb9F2c501216A6CAe04fe6"

export default config
