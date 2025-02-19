import React, { useEffect } from 'react';
import { Button, Dropdown, Layout, Menu, MenuProps, Space, message, notification, theme } from 'antd';
import { Route, RouterProvider, Routes, createBrowserRouter, useNavigate } from 'react-router-dom';
import { routes } from './common/routes';
import { connect, getAccount, setupNetwork } from './utils/web3';
import { setupSmartBCHNetwork } from './common/web3';
import CONFIG from './CONFIG';
import { getBCHAccount, getEVMAddress } from './lib/pay4best';
import { useStore } from './common/store';
import { DownOutlined, SmileOutlined } from '@ant-design/icons';
import config from './CONFIG';
import { connectSnap, getSnap } from './utils/snap/connect';
import { getAddress } from './utils/snap/rpc';

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const { state, setStoreItem } = useStore()
  const WALLET_KEY = "WALLET"
  const walletType = localStorage.getItem(WALLET_KEY) as any || "SNAP"

  useEffect(() => {
    if (window.location.pathname.includes("/chipnet/") && window.location.pathname !== "/chipnet" && window.location.pathname !== "/chipnet/") {
      window.location.href = "/chipnet"
      return
    } if (window.location.pathname.includes("/legacy/") && window.location.pathname !== "/legacy" && window.location.pathname !== "/legacy/") {
      window.location.href = "/legacy"
      return
    }
    const init = async () => {
      try {
        await connect()
        await setupSmartBCHNetwork()
        await setStoreItem({ account: await getAccount() });
        (window as any).ethereum?.on('accountsChanged', async () => {
          window.location.reload()
        });
      } catch (error: any) {
        console.log(error)
        api["error"]({
          message: 'Select chain error',
          description: error.message
        });
      }
    }
    init()
  }, [])


  useEffect(() => {
    async function init() {
      (window as any).ethereum?.on('accountsChanged', async () => {
        window.location.reload();
      })

      if (walletType === "SNAP") {
        await connect()
        const snapId = await connectSnap()
        const bchAccount = await getAddress(snapId!)
        setStoreItem({ snapId, bchAccount })
        return
      }

      async function getAccountKey() {
        const accountKey = `wallet-address-${CONFIG.MAINNET ? "true" : "false"}`;
        const accounts = await (window as any).ethereum?.request({ method: 'eth_requestAccounts' })
        return accountKey + '-0-' + (accounts && accounts[0] || "")
      }

      const account = localStorage.getItem(await getAccountKey())
      if (account) {
        setStoreItem({ bchAccount: account })
        return
      }

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = `${config.PAY4BEST_URL}?testnet=${!CONFIG.MAINNET ? "true" : ''}`;
      iframe.id = "walletFrame"
      document.body.appendChild(iframe);
      iframe.onload = async () => {
        try {
          // check evm address
          const accounts = await (window as any).ethereum?.request({ method: 'eth_requestAccounts' })
          if (await getEVMAddress() !== accounts[0]) {
            message.error(
              <div>Please open <a target='_blank' href={config.PAY4BEST_URL}>PAY4BEST</a> connect to MetaMask and <a onClick={() => window.location.reload()}>reload</a> current web page </div>,
              10000
            );
            return
          }

          const account = await getBCHAccount()
          localStorage.setItem(await getAccountKey(), account)
          setStoreItem({ bchAccount: account })
        } catch (error: any) {
          console.log(error)
          api["error"]({
            message: 'getBCHAccounterror',
            description: error.message
          });
        }
      }

      const a = document.createElement("iframe");
      a.style.display = "none";
      a.id = "WalletFrame-Link"
      document.body.appendChild(a);
    }
    init()
  }, [])

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const navigate = useNavigate();

  const items: MenuProps['items'] = [
    !CONFIG.MAINNET ?
      {
        key: '1',
        label: (
          <a target="_self" rel="noopener noreferrer" href="/">
            Mainnet
          </a>
        ),
      }
      : {
        key: '2',
        label: (
          <a target="_self" rel="noopener noreferrer" href="/chipnet">
            Chipnet
          </a>
        ),
      },
    {
      key: '3',
      label: (
        <a target="_self" rel="noopener noreferrer" href="/legacy">
          Legacy
        </a>
      ),
    }
  ]

  const walletItems: MenuProps['items'] = [
    walletType === "SNAP" ? {
      key: '1',
      label: (
        <a target="_self" onClick={() => { localStorage.setItem(WALLET_KEY, "PAY4BEST"); window.location.reload() }} rel="noopener noreferrer" >
          PAY4BEST
        </a>
      ),
    } :
      {
        key: '2',
        label: (
          <a target="_self" onClick={() => { localStorage.setItem(WALLET_KEY, "SNAP"); window.location.reload() }} rel="noopener noreferrer">
            SNAP
          </a>
        ),
      }
  ]

  if (!state.account) {
    return <Button onClick={() => connect().then(() => window.location.reload())}>Connect Wallet</Button>
  }

  return (
    <>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <div className="demo-logo" />
          <Menu
            onSelect={(({ key }) => navigate(routes.find(x => x.path === key)!.path))}
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={[window.location.pathname]}
            items={routes.map(({ icon, path, title }) => ({ key: path, icon, label: title }))}
          />
          <div style={{ flex: 1 }} />
          <Button type="link" style={{ marginRight: 20 }}> {state.account}</Button>

          <Dropdown menu={{ items }}>
            <a onClick={(e) => e.preventDefault()}>
              <Space>
                {CONFIG.MAINNET ? "Mainnet" : "Testnet"}
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
          <div style={{ width: 20 }} />
          <Dropdown menu={{ items: walletItems }}>
            <a onClick={(e) => e.preventDefault()}>
              <Space>
                {walletType}
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>

        </Header>

        <Content style={{ minHeight: "calc(100vh - 150px)", background: colorBgContainer, padding: '0 50px' }} >
          <Routes>
            {routes.map(r => <Route key={r.path} path={r.path} element={r.element} />)}
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center' }}>AtomicSwap ©2023 Created by SmartBCH</Footer>
      </Layout>
    </>
  );
};

export default App;
