import React, { useEffect } from 'react';
import { Button, Layout, Menu, notification, theme } from 'antd';
import { Route, RouterProvider, Routes, createBrowserRouter, useNavigate } from 'react-router-dom';
import { routes } from './common/routes';
import { connect, getAccount, setupNetwork } from './utils/web3';
import { setupSmartBCHNetwork } from './common/web3';
import CONFIG from './CONFIG';
import { getBCHAccount } from './lib/pay4best';
import { useStore } from './common/store';

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const {state,setStoreItem} = useStore()

  useEffect(() => {
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
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = `https://pay4.best?testnet=${!CONFIG.MAINNET ? "true" : ''}`;
    iframe.id = "walletFrame"
    document.body.appendChild(iframe);
    iframe.onload = async () => {
      try {
        setStoreItem({ bchAccount: await getBCHAccount() })
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

  if(!state.account) {
    return <Button onClick={connect}>Connect Wallet</Button>
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
        </Header>

        <Content style={{ minHeight: "calc(100vh - 150px)", background: colorBgContainer, padding: '0 50px' }} >
          <Routes>
            {routes.map(r => <Route key={r.path} path={r.path} element={r.element} />)}
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Atomic-swap ©2023 Created by SmartBCH</Footer>
      </Layout>
    </>
  );
};

export default App;
