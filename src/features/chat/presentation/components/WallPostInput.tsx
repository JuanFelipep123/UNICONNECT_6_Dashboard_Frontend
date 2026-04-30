import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '@shared/components/ui/Button';
import type { GroupMember, PendingAttachment, WallAttachment } from '../../domain/wall';
import { uploadToSupabase } from '../../infrastructure/attachmentService';
import { wallHttpService } from '../../infrastructure/wallHttpService';
import { useGroupMembers } from '../hooks/useGroupMembers';
import { AttachmentChip } from './AttachmentChip';

interface Props {
  groupId: string;
}

export function WallPostInput({ groupId }: Props) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(0);
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>([]);
  // Tracks names → ids of members explicitly selected from the dropdown
  const mentionedMapRef = useRef<Map<string, string>>(new Map());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { members, loading: membersLoading, error: membersError } = useGroupMembers(groupId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fix race condition: if the user typed @ before members finished loading,
  // re-run detection now that members are available.
  useEffect(() => {
    if (members.length === 0 || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? content.length;
    const beforeCursor = content.slice(0, cursor);
    if (!beforeCursor.match(/@([^@\n]*)$/)) return;
    detectMentionTriggerWith(content, cursor, members);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members]);

  const detectMentionTriggerWith = (val: string, cursorPos: number, memberList: typeof members) => {
    const beforeCursor = val.slice(0, cursorPos);
    const match = beforeCursor.match(/@([^@\n]*)$/);
    if (!match) {
      setShowMentions(false);
      return;
    }
    const query = match[1];
    const filtered = memberList.filter((m) =>
      m.name.toLowerCase().startsWith(query.toLowerCase()),
    );
    if (filtered.length === 0) {
      setShowMentions(false);
      return;
    }
    setFilteredMembers(filtered);
    setMentionQuery(query);
    setMentionStart(cursorPos - match[0].length);
    setShowMentions(true);
  };

  const detectMentionTrigger = (val: string, cursorPos: number) =>
    detectMentionTriggerWith(val, cursorPos, members);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    const cursor = e.target.selectionStart ?? val.length;
    detectMentionTrigger(val, cursor);
  };

  const selectMember = (member: GroupMember) => {
    const before = content.slice(0, mentionStart);
    const after = content.slice(mentionStart + 1 + mentionQuery.length);
    const newContent = `${before}@${member.name} ${after}`;
    setContent(newContent);
    mentionedMapRef.current.set(member.name, member.id);
    setShowMentions(false);
    // Restore focus and place cursor after the inserted mention
    const newCursor = before.length + 1 + member.name.length + 1;
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && e.key === 'Escape') {
      e.preventDefault();
      setShowMentions(false);
      return;
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      void handleSend();
    }
  };

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

    // Resolve mentions: only include those whose @name is still present in the text
    const mentionsEntries = [...mentionedMapRef.current.entries()].filter(([name]) =>
      trimmed.includes(`@${name}`),
    );
    const mentionIds = mentionsEntries.map(([, id]) => id);
    const mentionNames = mentionsEntries.map(([name]) => name);

    const result = await wallHttpService.sendPost(
      groupId,
      trimmed,
      attachments,
      mentionIds,
      mentionNames,
    );

    if (!result.success) {
      setSendError(result.error ?? 'No se pudo enviar el mensaje');
    } else {
      setContent('');
      setPendingAttachments([]);
      mentionedMapRef.current.clear();
    }

    setSending(false);
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

        {/* Textarea + mention dropdown */}
        <div className="relative flex-1">
          {showMentions && (
            <div
              ref={dropdownRef}
              className="absolute bottom-full left-0 z-10 mb-1 w-56 overflow-hidden rounded-lg border border-ink-100 bg-white shadow-lg"
            >
              {membersLoading ? (
                <p className="px-3 py-2 text-xs text-ink-400">Cargando miembros…</p>
              ) : membersError ? (
                <p className="px-3 py-2 text-xs text-red-500">{membersError}</p>
              ) : filteredMembers.length === 0 ? (
                <p className="px-3 py-2 text-xs text-ink-400">Sin coincidencias</p>
              ) : (
                filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectMember(member);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-800 hover:bg-brand-50"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                    {member.name}
                  </button>
                ))
              )}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje… usa @ para mencionar"
            rows={2}
            className="w-full resize-none rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

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
