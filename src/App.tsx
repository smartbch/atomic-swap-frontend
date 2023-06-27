import React, { useEffect } from 'react';
import { UploadOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, notification, theme } from 'antd';
import { Route, RouterProvider, Routes, createBrowserRouter, useNavigate } from 'react-router-dom';
import { routes } from './common/router';
import { connect, getAccount, setupNetwork } from './utils/web3';
import { setupSmartBCHNetwork } from './common/web3';
import CONFIG from './CONFIG';
import { getBCHAccount } from './lib/pay4best';
import { useGloabalStore } from './common/store';

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const [gloabalStore, setGloabalStoreStoreItem] = useGloabalStore()

  useEffect(() => {
    const init = async () => {
      try {
        await connect()
        await setupSmartBCHNetwork()
        await setGloabalStoreStoreItem({ account: await getAccount() });
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
        setGloabalStoreStoreItem({ bchAccount: await getBCHAccount() })
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

  return (
    <Layout>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
      >
        <div style={{ height: 50 }} >LOGO</div>
        <Menu
          onSelect={(({ key }) => navigate(routes.find(x => x.path === key)!.path))}
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[window.location.pathname]}
          items={routes.map(({ icon, path, title }) => ({ key: path, icon, label: title }))}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: "flex", alignItems: "center" }} >
          <div style={{ flex: 1 }} />
          <Button style={{ marginRight: 20 }}> {gloabalStore.account}</Button>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, minHeight: "calc(100vh - 153px)", background: colorBgContainer }}>
            <Routes>
              {routes.map(r => <Route key={r.path} path={r.path} element={r.element} />)}
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Automic-swap ©2023 Created by SmartBCH</Footer>
      </Layout>
    </Layout>
  );
};

export default App;