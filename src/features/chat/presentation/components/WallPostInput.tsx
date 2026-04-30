import { useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '@shared/components/ui/Button';
import type { PendingAttachment, WallAttachment } from '../../domain/wall';
import { uploadToSupabase } from '../../infrastructure/attachmentService';
import { wallHttpService } from '../../infrastructure/wallHttpService';
import { AttachmentChip } from './AttachmentChip';

interface Props {
  groupId: string;
}

export function WallPostInput({ groupId }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removePending = (localId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.localId !== localId));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;

    for (const file of files) {
      const localId = `${Date.now()}_${Math.random()}_${file.name}`;
      setPendingAttachments((prev) => [...prev, { localId, file, uploading: true }]);

      const result = await uploadToSupabase(file, groupId);

      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.localId === localId
            ? result.success
              ? { ...a, uploading: false, storagePath: result.storagePath }
              : { ...a, uploading: false, error: result.error }
            : a,
        ),
      );
    }
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    const readyAttachments = pendingAttachments.filter(
      (a) => !a.uploading && a.storagePath && !a.error,
    );

    if ((!trimmed && readyAttachments.length === 0) || sending) return;

    setSending(true);
    setSendError(null);

    const attachments: WallAttachment[] = readyAttachments.map((a) => ({
      fileName: a.file.name,
      fileType: a.file.type,
      fileSize: a.file.size,
      storagePath: a.storagePath!,
    }));

    const result = await wallHttpService.sendPost(groupId, trimmed, attachments);

    if (!result.success) {
      setSendError(result.error ?? 'No se pudo enviar el mensaje');
    } else {
      setContent('');
      setPendingAttachments([]);
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      void handleSend();
    }
  };

  const isUploading = pendingAttachments.some((a) => a.uploading);
  const hasReadyContent =
    content.trim().length > 0 ||
    pendingAttachments.some((a) => !a.uploading && a.storagePath && !a.error);
  const canSend = hasReadyContent && !sending && !isUploading;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3">
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((att) => (
            <AttachmentChip
              key={att.localId}
              attachment={att}
              onRemove={() => removePending(att.localId)}
            />
          ))}
        </div>
      )}

      {sendError && <p className="mb-2 text-xs font-medium text-red-600">{sendError}</p>}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Adjuntar archivo"
          className="flex-shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <Paperclip size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje… (Ctrl+Enter para enviar)"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />

        <Button
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="flex-shrink-0"
          title="Enviar"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
