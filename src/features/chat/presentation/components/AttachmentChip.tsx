import { Loader2, Paperclip, X } from 'lucide-react';
import type { PendingAttachment } from '../../domain/wall';

interface Props {
  attachment: PendingAttachment;
  onRemove: () => void;
}

export function AttachmentChip({ attachment, onRemove }: Props) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs ${
        attachment.error ? 'bg-red-50 border border-red-200' : 'bg-ink-100'
      }`}
    >
      {attachment.uploading ? (
        <Loader2 size={12} className="animate-spin text-brand-500" />
      ) : attachment.error ? (
        <span className="font-semibold text-red-400">!</span>
      ) : (
        <Paperclip size={12} className="text-ink-500" />
      )}

      <span className="max-w-[140px] truncate text-ink-700">{attachment.file.name}</span>

      {attachment.error && (
        <span className="max-w-[100px] truncate text-red-400" title={attachment.error}>
          {attachment.error}
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-ink-400 hover:text-red-500"
        aria-label="Quitar adjunto"
      >
        <X size={12} />
      </button>
    </div>
  );
}
