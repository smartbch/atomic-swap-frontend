import { useCallback, useEffect, useState } from 'react';
import { Network, Wallet, getNetworkProvider } from 'mainnet-js';
import { getTokenByCategory } from '../../../utils/token';
import { formatUnits } from '../../../utils/precision';

export interface IAggregatedTxHistory {
  height: number;
  txHash: string;
  valueChange: string;
  tokenChanges: {
    tokenType: 'CRC20' | 'CRC721' | 'BCMR';
    tokenSymbol: string;
    amountChange?: string;
    nftChange?: INftChange;
  }[];
}

interface INftChange {
  direction: 'Got' | 'Spent'
  capability: string;
  commitment: string;
}


export const useTxHistory = (address: string, pageIndex: number, pageSize: number) => {
    const [aggregatedTxHistories, setAggregatedTxHistories] = useState<IAggregatedTxHistory[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
  
    const refreshHistory = useCallback(async () => {
      if (!address) {
        setAggregatedTxHistories([]);
        return;
      }
      setLoading(true)
  
      const wallet = await Wallet.fromCashaddr(address);
      const transactions = await wallet.getRawHistory();
      setTotal(transactions.length)
  
      if (transactions.length === 0) {
        setLoading(false)
        setAggregatedTxHistories([])
        return;
      }
  
      const needQueryTxs = transactions.reverse().slice((pageIndex - 1) * pageSize, pageIndex * pageSize)
  
      let _aggregatedTxHistories: IAggregatedTxHistory[] = []
      let txHistories: IAggregatedTxHistory[] = await Promise.all(needQueryTxs.map(v => getTxDetail(wallet.network, v.tx_hash, address, v.height)))
      _aggregatedTxHistories = _aggregatedTxHistories.concat(txHistories);
      setLoading(false)
      setAggregatedTxHistories(_aggregatedTxHistories);
    }, [address, pageIndex, pageSize])
  
    useEffect(() => {
      setLoading(false)
      refreshHistory()
    }, [address, pageIndex, pageSize]);
  
    return { aggregatedTxHistories, refreshHistory, total, loading };
  };
  
  async function getTxDetail(network: Network, txHash: string, address: string, height: number) {
    const txDetail = await getNetworkProvider(network).getRawTransactionObject(txHash);
    console.log('txDetail: ', txDetail);
  
    let bchChange = 0;
    let tokenChange = new Map<string, number>(); // category => amount, only for FT
    let nftChange = new Map<string, INftChange>(); // category => amount, only for NFT
  
    for (const vin of txDetail.vin) {
      const vinDetail = await getNetworkProvider(network).getRawTransactionObject(vin.txid);
      console.log('vinDetail: ', vinDetail);
      const outpointVout = vinDetail.vout[vin.vout];
      if (outpointVout.scriptPubKey.addresses.length === 1 && outpointVout.scriptPubKey.addresses[0] === address) {
        // calculate spent
        // bch spent
        bchChange -= Number(outpointVout.value.toFixed(8));
        if (outpointVout.tokenData) {
          // nft spent
          if (outpointVout.tokenData!.nft) {
            nftChange.set(outpointVout.tokenData!.category, {
              direction: 'Spent',
              capability: outpointVout.tokenData!.nft!.capability,
              commitment: outpointVout.tokenData!.nft!.commitment,
            });
            continue;
          }
  
          // ft spent
          const tokenSpentAmount: number = Number(tokenChange.get(outpointVout.tokenData!.category) ?? 0) - Number(outpointVout.tokenData!.amount);
          tokenChange.set(outpointVout.tokenData!.category, tokenSpentAmount);
        }
      }
    }
  
    for (const vout of txDetail.vout) {
      if (vout.scriptPubKey.addresses?.length === 1 && vout.scriptPubKey.addresses[0] === address) {
        // calculate got
        // bch got
        bchChange += Number(vout.value.toFixed(8));
        if (vout.tokenData) {
          // nft got
          if (vout.tokenData!.nft) {
            if (nftChange.has(vout.tokenData!.category)) {
              nftChange.delete(vout.tokenData!.category); // nft not change
            } else {
              nftChange.set(vout.tokenData!.category, {
                direction: 'Got',
                capability: vout.tokenData!.nft!.capability,
                commitment: vout.tokenData!.nft!.commitment,
              });
            }
            continue;
          }
  
          // ft got
          console.log('tokenchange: ', (tokenChange.get(vout.tokenData!.category)));
          const tokenGotAmount: number = Number(tokenChange.get(vout.tokenData!.category) ?? 0) + Number(vout.tokenData!.amount);
          console.log('tokenGotAmount: ', tokenGotAmount);
          tokenChange.set(vout.tokenData!.category, tokenGotAmount);
        }
      }
    }
  
  
    const hisItem: IAggregatedTxHistory = {
      height,
      txHash,
      valueChange: bchChange.toFixed(8),
      tokenChanges: []
    };
  
    for (let [category, change] of tokenChange) {
      let token = await getTokenByCategory(category);
      if (!token) {
        token = {
          symbol: "-?-",
          decimals: 0
        } as any
      }
      hisItem.tokenChanges.push({
        tokenType: token!.type ?? 'BCMR',
        tokenSymbol: token!.symbol,
        amountChange: formatUnits(change, token!.decimals),
      });
    }
  
    for (let [category, change] of nftChange) {
      let token = await getTokenByCategory(category);
      if (!token) {
        token = {
          symbol: "-?-",
        } as any
      }
      hisItem.tokenChanges.push({
        tokenType: 'CRC721',
        tokenSymbol: token!.symbol,
        nftChange: {
          direction: change.direction,
          capability: change.capability,
          commitment: change.commitment,
        }
      });
    }
    return hisItem;
  }
  
  