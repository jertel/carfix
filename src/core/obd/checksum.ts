/**
 * Ford As-Built Checksum Engine & Bitmask Utility
 */

/**
 * Calculates the Ford 8-bit As-Built checksum for a given line address and data bytes.
 *
 * Example address: "726-63-02" -> Header 0x07 0x26, Line 0x63, Block 0x02
 * Example data: "0401 0100 00" -> Bytes [0x04, 0x01, 0x01, 0x00, 0x00]
 */
export function calculateFordChecksum(address: string, dataHex: string): string {
  // Clean address string (remove hyphens/spaces)
  const cleanAddr = address.replace(/[^0-9A-Fa-f]/g, '');
  // Clean data string (remove spaces)
  const cleanData = dataHex.replace(/[^0-9A-Fa-f]/g, '');

  let sum = 0;

  // Address parsing for Ford 3-part format (e.g. 726-63-02 -> "726", "63", "02")
  if (cleanAddr.length >= 7) {
    const headerHex = cleanAddr.substring(0, 3).padStart(4, '0'); // e.g. "0726"
    const lineHex = cleanAddr.substring(3, 5);                     // e.g. "63"
    const blockHex = cleanAddr.substring(5, 7);                    // e.g. "02"

    sum += parseInt(headerHex.substring(0, 2), 16) || 0;
    sum += parseInt(headerHex.substring(2, 4), 16) || 0;
    sum += parseInt(lineHex, 16) || 0;
    sum += parseInt(blockHex, 16) || 0;
  }

  // Add data bytes
  for (let i = 0; i < cleanData.length; i += 2) {
    const byteHex = cleanData.substring(i, i + 2);
    if (byteHex.length === 2) {
      sum += parseInt(byteHex, 16) || 0;
    }
  }

  const checksumByte = (sum % 256).toString(16).toUpperCase().padStart(2, '0');
  return checksumByte;
}

/**
 * Validates whether an existing As-Built line has a valid checksum.
 * Line format: "726-63-02 0401 0100 003B"
 */
export function verifyFordChecksum(lineText: string): boolean {
  const parts = lineText.trim().split(/\s+/);
  if (parts.length < 2) return false;

  const address = parts[0];
  const fullDataHex = parts.slice(1).join('').replace(/[^0-9A-Fa-f]/g, '');

  if (fullDataHex.length < 4) return false;

  const dataPayloadHex = fullDataHex.substring(0, fullDataHex.length - 2);
  const givenChecksum = fullDataHex.substring(fullDataHex.length - 2).toUpperCase();

  const expectedChecksum = calculateFordChecksum(address, dataPayloadHex);
  return givenChecksum === expectedChecksum;
}

/**
 * Applies a mask modification to a hex string and appends the freshly calculated checksum.
 * Mask format e.g. "xxx0 xxxx xx--" where 'x' preserves existing nibble, hex digit replaces, '-' is checksum.
 */
export function applyAsBuiltModification(
  address: string,
  existingHex: string,
  mask: string,
  enable: boolean = true,
  bitValues?: Array<Record<number, number>>
): string {
  const cleanExisting = existingHex.replace(/[^0-9A-Fa-f]/g, '');
  const cleanMask = mask.replace(/\s+/g, '');

  let modifiedData = '';
  let nonXIndex = 0;

  for (let i = 0; i < cleanExisting.length - 2; i++) {
    const maskChar = cleanMask[i] || 'x';
    if (maskChar === 'x' || maskChar === '-') {
      modifiedData += cleanExisting[i];
    } else {
      let nibbleVal = parseInt(cleanExisting[i], 16);
      if (isNaN(nibbleVal)) nibbleVal = 0;

      if (bitValues && bitValues[nonXIndex]) {
        const bitRule = bitValues[nonXIndex];
        for (const [bitStr, targetVal] of Object.entries(bitRule)) {
          const bitIdx = Number(bitStr);
          const bitToApply = enable ? targetVal : (targetVal === 1 ? 0 : 1);
          if (bitToApply === 1) {
            nibbleVal |= (1 << bitIdx);
          } else {
            nibbleVal &= ~(1 << bitIdx);
          }
        }
        modifiedData += nibbleVal.toString(16).toUpperCase();
      } else {
        modifiedData += maskChar.toUpperCase();
      }

      nonXIndex++;
    }
  }

  const newChecksum = calculateFordChecksum(address, modifiedData);
  const resultDataHex = modifiedData + newChecksum;

  // Format into blocks of 4 hex chars for Ford display
  const formattedData = resultDataHex.match(/.{1,4}/g)?.join(' ') || resultDataHex;
  return formattedData;
}
