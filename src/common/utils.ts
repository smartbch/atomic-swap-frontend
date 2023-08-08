// Note: input a hex string without '0x' prefix
export function reverseHexBytes(hexStr: string): string {
    if (hexStr === '') {
      return '';
    }
    if (hexStr.length % 2 !== 0) {
      hexStr = '0' + hexStr;
    }
    return hexStr.match(/[a-fA-F0-9]{2}/g)!.reverse().join('');
  }