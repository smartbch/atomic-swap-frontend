import modal from "antd/es/modal";
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useCallback } from "react";
import { notification } from "antd";

const CONFIRM_CANCEL = "CONFIRM_CANCEL"

export async function confirmOperation(params: { title?: string, content?: string }) {
    return new Promise((resolve, reject) => {
        modal.confirm({
            title: params.title || 'Confirm',
            icon: <ExclamationCircleOutlined />,
            content: params.content || 'Confirm',
            onOk: () => { resolve(''); return false },
            onCancel: () => { reject("CONFIRM_CANCEL"); return false },
        });
    })
}


export function wrapOperation(fn: any, successMsg: string = '') {
    return async (...args: any) => {
        try {
            await fn(...args)
            closeLoading()
            if (successMsg) {
                notification.success({ message: 'success', description: successMsg });
            }
        } catch (error: any) {
            if (error === CONFIRM_CANCEL) {
                return
            }
            console.log(error)
            closeLoading()
            let JSONRPCErrorMessage = error?.data?.message
            JSONRPCErrorMessage = JSONRPCErrorMessage ? `: ${JSONRPCErrorMessage}` : ""
            notification.error({
                duration: 0,
                message: 'error',
                description: error.message + JSONRPCErrorMessage
            });
        }
    }

}


export function showLoading() {
    const target = document.createElement('div');
    target.id = "Loading"
    target.innerHTML = `<div style="z-index: 20001; position: fixed; inset: 0px; background: rgba(0, 0, 0, 0.45); text-align: center;"><svg viewBox="0 0 50 50" style="margin-top: calc(50vh - 60px); width: 50px; height: 50px; animation: 2s linear 0s infinite normal none running loading-rotate;"><circle cx="25" cy="25" r="20" fill="none" style="stroke: rgb(22, 119, 255); stroke-linecap: round; animation: 1.5s ease-in-out 0s infinite normal none running loading-dash; stroke-dasharray: 90, 150; stroke-dashoffset: 0; stroke-width: 2;"></circle></svg><p style="color: rgb(22, 119, 255);">Loading</p></div>`;
    document.body.append(target)
}

export function closeLoading() {
    const ele = document.querySelector("#Loading")
    ele && ele.remove()
}

export function copyText(text: string) {
    let inputDom = document.createElement('input');
    inputDom.setAttribute('readonly', 'readonly');
    inputDom.value = text;
    document.body.appendChild(inputDom);
    inputDom.select();
    document.execCommand('Copy');
    inputDom.style.display = 'none';
    inputDom.remove();
    notification.success({ message: 'success', description: "Copy successfully" });
}