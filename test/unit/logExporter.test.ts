import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportLogsToFile } from '../../src/core/utils/logExporter';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn()
  }
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn()
  },
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' }
}));

vi.mock('@capacitor/share', () => ({
  Share: {
    canShare: vi.fn(),
    share: vi.fn()
  }
}));

describe('logExporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports logs via web download when not on native platform', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    // Mock DOM URL methods and link click
    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const mockClick = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = document.createElement(tagName);
      if (tagName === 'a') {
        el.click = mockClick;
      }
      return el;
    });

    const result = await exportLogsToFile('Test log content', 'test.txt');

    expect(result.success).toBe(true);
    expect(result.method).toBe('web-download');
    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('exports logs via Capacitor Filesystem and Share when on native platform', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file:///cache/test.txt' } as any);
    vi.mocked(Share.canShare).mockResolvedValue({ value: true });
    vi.mocked(Share.share).mockResolvedValue({} as any);

    const result = await exportLogsToFile('Test log content', 'test.txt');

    expect(result.success).toBe(true);
    expect(result.method).toBe('native-share');
    expect(Filesystem.writeFile).toHaveBeenCalledWith({
      path: 'test.txt',
      data: 'Test log content',
      directory: 'CACHE',
      encoding: 'utf8'
    });
    expect(Share.share).toHaveBeenCalledWith({
      title: 'CarCommander Diagnostic Logs',
      text: 'Diagnostic log export',
      url: 'file:///cache/test.txt',
      files: ['file:///cache/test.txt'],
      dialogTitle: 'Save or Share Diagnostic Logs'
    });
  });
});
