import React, { useEffect } from 'react';
import { Button, Dropdown, Layout, Menu, MenuProps, Space, notification, theme } from 'antd';
import { Route, RouterProvider, Routes, createBrowserRouter, useNavigate } from 'react-router-dom';
import { routes } from './common/routes';
import { connect, getAccount, setupNetwork } from './utils/web3';
import { setupSmartBCHNetwork } from './common/web3';
import CONFIG from './CONFIG';
import { getBCHAccount } from './lib/pay4best';
import { useStore } from './common/store';
import { DownOutlined, SmileOutlined } from '@ant-design/icons';

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const { state, setStoreItem } = useStore()

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
    const accountKey = `wallet-address-${CONFIG.MAINNET ? "true" : "false"}`;
    (window as any).ethereum?.on('accountsChanged', async () => {
      window.localStorage.removeItem(accountKey)
      window.location.reload();
    })

    const account = localStorage.getItem(accountKey)
    if (account) {
      setStoreItem({ bchAccount: account })
      return
    }

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = `https://pay4.best?testnet=${!CONFIG.MAINNET ? "true" : ''}`;
    iframe.id = "walletFrame"
    document.body.appendChild(iframe);
    iframe.onload = async () => {
      try {
        const account = await getBCHAccount()
        localStorage.setItem(accountKey, account)
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
