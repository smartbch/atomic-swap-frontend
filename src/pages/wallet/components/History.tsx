import React, { useEffect, useState } from 'react';
import qs from 'qs';
import { Table } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import { useTxHistory } from '../hooks/useTxHistory';
import config from '../../../CONFIG';
import { useStore } from '../../../common/store';

interface INftChange {
    direction: 'Got' | 'Spent'
    capability: string;
    commitment: string;
}

interface ITokenChange {
    tokenType: string;
    tokenSymbol: string;
    amountChange?: string;
    nftChange?: INftChange;
}

interface IHistoryDataRow {
    txId: string;
    blockHeight: number;
    valueChange: string;
    tokenChanges: ITokenChange[];
}

const testnetExplorer = 'https://chipnet.imaginary.cash';
const mainnetExplorer = 'https://explorer.bitcoinunlimited.info';

function concatExplorerUrlForTx(txId: string) {
    return config.MAINNET
        ? mainnetExplorer + '/tx/' + txId
        : testnetExplorer + '/tx/' + txId;
}

function concatExplorerUrlForBlockHeight(blockHeight: string) {
    return config.MAINNET
        ? mainnetExplorer + '/block-height/' + blockHeight
        : testnetExplorer + '/block-height/' + blockHeight;
}

function tokenChangesToString(tokenChanges: ITokenChange[]): string {
    if (tokenChanges.length === 0) {
        return '';
    }

    let texts: string[] = [];
    for (const tokenChange of tokenChanges) {
        if (tokenChange.nftChange) {
            texts.push(`${tokenChange.nftChange!.direction} CRC721 NFT ${tokenChange.tokenSymbol}: capability: ${tokenChange.nftChange!.capability}, commitment: ${tokenChange.nftChange!.commitment}`);
            continue
        }

        texts.push(`${tokenChange.tokenType} Token ${tokenChange.tokenSymbol} amount change: ${tokenChange.amountChange!}`);
    }
    return texts.join(`<br/>`);
}


function createTxHistoryData(
    txId: string,
    blockHeight: number,
    valueChange: string,
    tokenChanges: ITokenChange[],
) {
    return { txId, blockHeight, valueChange, tokenChanges };
}

const columns: ColumnsType<IHistoryDataRow> = [
    {
        title: 'Transaction ID',
        dataIndex: 'txId',
        render: (txId) => <a target="_blank" href={concatExplorerUrlForTx(txId)}>{txId.slice(0, 20)}...</a>,
        width: '20%',
    },
    {
        title: 'Block Height',
        dataIndex: 'blockHeight',
        width: '15%',
        render: (blockHeight) => <a target="_blank" href={concatExplorerUrlForBlockHeight(blockHeight)}>{blockHeight}</a>,

    },
    {
        title: 'BCH Change',
        dataIndex: 'valueChange',
        width: '15%',
    },
    {
        title: 'Token Change',
        dataIndex: 'tokenChanges',
        render: (tokenChanges) => <div dangerouslySetInnerHTML={{ __html: tokenChangesToString(tokenChanges) }} />

    }
]


export default () => {
    const [pageIndex, setPageIndex] = useState(1)
    const { state, setStoreItem } = useStore()
    const { aggregatedTxHistories, total, loading } = useTxHistory(state.bchAccount, pageIndex, 10);

    const rows: IHistoryDataRow[] = [];
    for (const txHistories of aggregatedTxHistories) {
        rows.push(createTxHistoryData(
            txHistories.txHash,
            txHistories.height,
            txHistories.valueChange,
            txHistories.tokenChanges,
        ));
    }

    const handleTableChange = (
        pagination: TablePaginationConfig,
    ) => {
        setPageIndex(pagination.current!)
    };

    return (
        <Table
            columns={columns}
            rowKey={"txId"}
            dataSource={rows}
            pagination={{ pageSize: 10, current: pageIndex, total, showSizeChanger: false }}
            loading={loading}
            onChange={handleTableChange}
        />
    );
};
