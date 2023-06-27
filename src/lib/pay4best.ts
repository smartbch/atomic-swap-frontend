export async function getBCHAccount(): Promise<string> {
    console.log('getBCHAccount...');
    const account: any = await new Promise((r, _) => {
        const getAccount = () => {
            const walletFrame: any = document.getElementById('walletFrame');
            const addrChannel = new MessageChannel();
            addrChannel.port2.onmessage = function (e) {
                if (e.data === 'wallet-not-init') {
                    setTimeout(() => {
                        getAccount()
                    }, 1000);
                } else {
                    r(e.data)
                }
            }
            walletFrame.contentWindow.postMessage({
                Pay4BestWalletReq: {
                    GetAddr: true,
                }
            }, '*', [addrChannel.port1]);
        }

        getAccount()
    })
    return account
}

export async function signTx(data: any): Promise<any> {
    return await new Promise((resolve, reject) => {
        const walletFrame = (window as any).document.getElementById('walletFrame')
        let targetURL = `${walletFrame.src}&origin=${encodeURI(window.location.origin)}&req=`;
        const txChannel = new MessageChannel();
        txChannel.port2.onmessage = function (e) {
            console.log('I get reqID ', e.data);
            const reqID = e.data.reqID;
            console.log("reqID", reqID);
            targetURL = targetURL + reqID;

            if (!e.data.ok) { // the browser does not allow us to open a window
                var myLink: any = document.getElementById("WalletFrame-Link");
                myLink.href = targetURL;
                // myLink.style.display = "block";
                myLink.click()
            }
            txChannel.port2.onmessage = function (e) {
                console.log('I get signed result ', e.data);
                if (e.data.refused) {
                    reject(new Error("You refused to sign."))
                    return
                }
                resolve(Buffer.from(e.data.signedTx).toString('hex'))
            }
        }
        walletFrame.contentWindow.postMessage({
            Pay4BestWalletReq: {
                UnsignedTx: data,
            }
        }, '*', [txChannel.port1]);


    })
}