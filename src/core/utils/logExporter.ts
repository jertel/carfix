import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface IExportLogsResult {
  success: boolean;
  method: 'native-share' | 'native-file' | 'web-download' | 'error';
  path?: string;
  error?: string;
}

/**
 * Exports log text to a file.
 * Uses Capacitor Filesystem + Share on native mobile platforms (Android / iOS),
 * and falls back to standard Blob URL link download on Web browsers.
 */
export async function exportLogsToFile(
  logsText: string,
  filename?: string
): Promise<IExportLogsResult> {
  const name = filename || `carcommander_logs_${Date.now()}.txt`;

  if (Capacitor.isNativePlatform()) {
    try {
      const res = await Filesystem.writeFile({
        path: name,
        data: logsText,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      const canShare = await Share.canShare().catch(() => ({ value: false }));

      if (canShare.value) {
        await Share.share({
          title: 'CarCommander Diagnostic Logs',
          text: 'Diagnostic log export',
          url: res.uri,
          files: [res.uri],
          dialogTitle: 'Save or Share Diagnostic Logs'
        });
        return { success: true, method: 'native-share', path: res.uri };
      } else {
        return { success: true, method: 'native-file', path: res.uri };
      }
    } catch (err: any) {
      console.error('Failed to write/share logs on native platform:', err);
      return { success: false, method: 'error', error: err?.message || String(err) };
    }
  }

  // Web Browser fallback
  try {
    const blob = new Blob([logsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true, method: 'web-download' };
  } catch (err: any) {
    console.error('Failed to trigger web log download:', err);
    return { success: false, method: 'error', error: err?.message || String(err) };
  }
}
