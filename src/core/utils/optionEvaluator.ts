import { IVehicleOption } from '../types/module';

/**
 * Evaluates whether a vehicle option is currently enabled based on hex data line.
 */
export function isOptionEnabled(option: IVehicleOption, hexLine?: string): boolean {
  if (!hexLine || !option.mask) return false;
  const cleanHex = hexLine.replace(/\s+/g, '');
  const cleanMask = option.mask.replace(/\s+/g, '');

  if (cleanHex.length < cleanMask.length) return false;

  let nonXIndex = 0;

  for (let i = 0; i < cleanMask.length; i++) {
    const maskChar = cleanMask[i];
    if (maskChar === 'x' || maskChar === '-') continue;

    const currentNibble = parseInt(cleanHex[i], 16);
    if (isNaN(currentNibble)) return false;

    if (option.bitValues && option.bitValues[nonXIndex]) {
      const bitRule = option.bitValues[nonXIndex];
      for (const [bitStr, targetVal] of Object.entries(bitRule)) {
        const bitIdx = Number(bitStr);
        const actualBit = (currentNibble >> bitIdx) & 1;
        if (actualBit !== targetVal) {
          return false;
        }
      }
    } else {
      if (cleanHex[i].toUpperCase() !== maskChar.toUpperCase()) {
        return false;
      }
    }

    nonXIndex++;
  }

  return true;
}
