import { useEffect, useState } from 'react';
import { File, FileSpreadsheet, FileText } from 'lucide-react';
import type { WallAttachment } from '../../domain/wall';
import { wallHttpService } from '../../infrastructure/wallHttpService';
import { formatFileSize, getAttachmentDisplayType } from '@shared/utils/file';

interface Props {
  attachment: WallAttachment;
}

const FILE_CONFIG = {
  pdf: { Icon: FileText, color: 'text-red-500', label: 'PDF' },
  excel: { Icon: FileSpreadsheet, color: 'text-green-600', label: 'Excel' },
  generic: { Icon: File, color: 'text-ink-500', label: 'Archivo' },
} as const;

export function AttachmentRenderer({ attachment }: Props) {
  const type = getAttachmentDisplayType(attachment.fileType, attachment.fileName);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (type !== 'image' || !attachment.id) return;
    wallHttpService.getAttachmentUrl(attachment.id).then((res) => {
      if (res.success && res.data) setImageUrl(res.data);
    });
  }, [type, attachment.id]);

  const openAttachment = async () => {
    if (!attachment.id) return;
    if (type === 'image' && imageUrl) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const result = await wallHttpService.getAttachmentUrl(attachment.id);
    if (result.success && result.data) {
      window.open(result.data, '_blank', 'noopener,noreferrer');
    }
  };

  if (type === 'image') {
    return (
      <button
        type="button"
        onClick={() => void openAttachment()}
        className="block overflow-hidden rounded-lg border border-ink-100 transition hover:opacity-90"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={attachment.fileName}
            className="h-40 max-w-xs object-cover"
          />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center bg-ink-100">
            <span className="text-xs text-ink-400">Cargando imagen...</span>
          </div>
        )}
      </button>
    );
  }

  const config = FILE_CONFIG[type];

  return (
    <button
      type="button"
      onClick={() => void openAttachment()}
      className="flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 transition hover:bg-ink-100"
    >
      <config.Icon size={22} className={config.color} />
      <div className="text-left">
        <p className="max-w-[200px] truncate text-sm font-medium text-ink-900">
          {attachment.fileName}
        </p>
        <p className="text-xs text-ink-400">
          {config.label} · {formatFileSize(attachment.fileSize)}
        </p>
      </div>
    </button>
  );
}
