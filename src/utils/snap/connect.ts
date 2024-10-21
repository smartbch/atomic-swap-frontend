/*
 * Window type extension to support ethereum
 */

import config from "../../CONFIG";

declare global {
    interface Window {
        ethereum: any;
    }
}

type Snap = {
    permissionName: string;
    id: string;
    version: string;
    initialPermissions: Record<string, unknown>;
};

type GetSnapsResponse = Record<string, Snap>;

const getSnaps = async (): Promise<GetSnapsResponse> => {
    return (await window.ethereum.request({
        method: 'wallet_getSnaps',
    })) as unknown as GetSnapsResponse;
};

export const getSnap = async (version?: string): Promise<Snap | undefined> => {
    try {
        const snaps = await getSnaps();
        return Object.values(snaps).find(
            (snap) =>
                snap.id === config.SNAP_ORIGIN && (!version || snap.version === version),
        );
    } catch (e) {
        console.log('Failed to obtain installed snap', e);
        return undefined;
    }
};


export const connectSnap = async (
    params: Record<'version' | string, unknown> = {},
) => {
    await window.ethereum.request({
        method: 'wallet_requestSnaps',
        params: {
            [config.SNAP_ORIGIN]: params,
        },
    });
    const snap = await getSnap()
    return snap?.id
};

