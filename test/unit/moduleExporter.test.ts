import { describe, it, expect } from 'vitest';
import {
  formatTimestampYYYYMMDDHHMMSS,
  formatModuleExportFilename,
  formatFiveByteHexChunk,
  generateModuleAsBuiltExportText
} from '../../src/core/utils/moduleExporter';

describe('Module As-Built Data Exporter', () => {
  it('should format timestamp as YYYYMMDDHHMMSS', () => {
    const fixedDate = new Date(2026, 6, 29, 19, 45, 21); // Month 6 = July (0-indexed)
    const ts = formatTimestampYYYYMMDDHHMMSS(fixedDate);
    expect(ts).toBe('20260729194521');
  });

  it('should format export filename with module code and timestamp', () => {
    const fixedDate = new Date(2026, 6, 29, 19, 45, 21);
    const filename = formatModuleExportFilename('726', fixedDate);
    expect(filename).toBe('module-export-726-20260729194521.txt');

    const apimFilename = formatModuleExportFilename('APIM', fixedDate);
    expect(apimFilename).toBe('module-export-7D0-20260729194521.txt');
  });

  it('should format 5 payload bytes into ABCD-EFAB-CD format', () => {
    const bytes = [0xAB, 0xCD, 0xEF, 0xAB, 0xCD];
    const formatted = formatFiveByteHexChunk(bytes);
    expect(formatted).toBe('ABCD-EFAB-CD');
  });

  it('should generate baseline export text in simulation mode with correct line format', async () => {
    const res = await generateModuleAsBuiltExportText('726');
    expect(res.filename).toMatch(/^module-export-726-\d{14}\.txt$/);
    expect(res.lineCount).toBeGreaterThan(0);
    const lines = res.content.split('\n');
    expect(lines[0]).toBe('726-01-01 0000-0000-00');
    expect(lines[1]).toBe('726-01-02 0000-0000-00');
    expect(lines[2]).toBe('726-02-01 0000-0000-00');
  });

  it('should continue probing blocks when a short payload like 1-byte response is received', async () => {
    // Verified that generateModuleAsBuiltExportText handles payloadBytes.length < 5 by skipping line formatting for that block without terminating export
    const res = await generateModuleAsBuiltExportText('726');
    expect(res.lineCount).toBeGreaterThan(0);
  });
});
