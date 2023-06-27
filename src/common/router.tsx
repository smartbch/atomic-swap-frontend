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
        title: "swap"
    },
    {
        path: "/history",
        element: <History />,
        icon: <HistoryOutlined />,
        title: "history"
    },
    {
        path: "/bot",
        element: <Bot />,
        icon: <SettingOutlined />,
        title: "bot"
    },
    {
        path: "/wallet",
        element: <Wallet />,
        icon: <WalletOutlined />,
        title: "wallet"
    },
]