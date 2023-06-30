import { Button, Card, Form, Input, Switch, Tabs, TabsProps, notification } from "antd";
import List from "./components/List";
import Setting from "./components/Setting";
import Unavailable from "./components/Unavailable";

// const DatePicker = DatePicker_.generatePicker<Moment>(momentGenerateConfig);

export default function () {
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: `Bot List`,
            children: <List />,
        },
        {
            key: '2',
            label: `Setting`,
            children: <Setting />,
        },
        {
            key: '3',
            label: `Unavailable`,
            children: <Unavailable />,
        },
    ];

    return (
        <div style={{ width: 1000, margin: "0 auto", marginTop: 50 }}>
            <Tabs defaultActiveKey="1" items={items} />;
        </div>)
}