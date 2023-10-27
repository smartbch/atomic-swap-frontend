import bchaddr from 'bchaddrjs';

export function isLegacyAddress(addr: string) {
    try {
        return bchaddr.isLegacyAddress(addr)
    } catch (error) {
        return false
    }
}