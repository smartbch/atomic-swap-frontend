import { Button, Card, Form, Input, Switch, Tabs, TabsProps, notification } from "antd";
import MyWallet from "./components/MyWallet";
import History from "./components/History";

export default function () {
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: `My Wallet`,
            children: <MyWallet />,
        },
        {
            key: '2',
            label: `History`,
            children: <History />,
        },
    ];

    return (
        <div style={{ width: 1000, margin: "0 auto", marginTop: 50 }}>
            <Tabs defaultActiveKey="1" items={items} />
        </div>)
}