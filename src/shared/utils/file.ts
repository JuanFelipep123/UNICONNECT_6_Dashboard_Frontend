export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type AttachmentDisplayType = 'image' | 'pdf' | 'excel' | 'generic';

export function getAttachmentDisplayType(fileType: string, fileName: string): AttachmentDisplayType {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf') return 'pdf';
  if (
    fileType.includes('spreadsheet') ||
    fileType === 'application/vnd.ms-excel' ||
    fileType === 'text/csv' ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls') ||
    fileName.endsWith('.csv')
  )
    return 'excel';
  return 'generic';
}
