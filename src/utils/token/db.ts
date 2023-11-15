import Dexie from 'dexie';

export const db: any = new Dexie('Fex-Tokens-DB');

db.version(1).stores({
    Tokens: '++id, category, symbol'
});


export async function insertTokensToIndexeDB(records: any[]) {
    return await db.Tokens.bulkAdd(records);
}

export async function findToken({ category }: { category: string }) {
    return await db.Tokens.get({ category })
}