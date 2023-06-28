import User from "../pages/swap/Swap";
import History from "../pages/history/History";
import Bot from "../pages/bot/Bot";
import Wallet from "../pages/wallet/Wallet";

import { SwapOutlined, SettingOutlined, HistoryOutlined, WalletOutlined } from '@ant-design/icons';

export const routes = [
    {
        path: "/",
        element: <User />,
        icon: <SwapOutlined />,
        title: "Swap"
    },
    {
        path: "/history",
        element: <History />,
        icon: <HistoryOutlined />,
        title: "History"
    },
    {
        path: "/bot",
        element: <Bot />,
        icon: <SettingOutlined />,
        title: "Bot"
    },
    {
        path: "/wallet",
        element: <Wallet />,
        icon: <WalletOutlined />,
        title: "Wallet"
    },
]