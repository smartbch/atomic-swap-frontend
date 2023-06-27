import modal from "antd/es/modal";
import { ExclamationCircleOutlined } from '@ant-design/icons';

export async function confirmOperation(params: { title?: string, content?: string }) {
    return new Promise((resolve, reject) => {
        modal.confirm({
            title: params.title || 'Confirm',
            icon: <ExclamationCircleOutlined />,
            content: params.content || 'Confirm',
            onOk: () => { resolve(''); return false },
            onCancel: () => { reject(new Error("User cancel confirm")); return false },
        });
    })
} 