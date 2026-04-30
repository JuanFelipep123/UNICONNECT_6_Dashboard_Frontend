import type { ReactNode } from 'react';
import type { WallPost } from '../../domain/wall';
import { formatRelativeTime } from '@shared/utils/time';

interface Props {
  post: WallPost;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderWithMentions(content: string, mentionedNames: string[]): ReactNode {
  if (!mentionedNames.length) return content;

  const pattern = new RegExp(
    `(@(?:${mentionedNames.map(escapeRegex).join('|')}))(?=[\\s.,;!?\n]|$)`,
    'g',
  );

  const parts: ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIdx) parts.push(content.slice(lastIdx, match.index));
    parts.push(
      <mark
        key={match.index}
        className="rounded bg-brand-100 px-0.5 font-semibold text-brand-800 not-italic"
      >
        {match[1]}
      </mark>,
    );
    lastIdx = match.index + match[1].length;
  }

  if (lastIdx < content.length) parts.push(content.slice(lastIdx));
  return parts.length ? parts : content;
}

export function WallPostCard({ post }: Props) {
  const initials = (post.senderName ?? 'U').charAt(0).toUpperCase();
  const contentNode = renderWithMentions(post.content, post.mentionedNames);

  return (
    <div className="flex gap-3">
      <div className="h-9 w-9 flex-shrink-0 rounded-full overflow-hidden">
        {post.avatarUrl ? (
          <img
            src={post.avatarUrl}
            alt={post.senderName ?? 'Usuario'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-100 text-sm font-bold text-brand-900">
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-ink-900">{post.senderName ?? 'Usuario'}</span>
          <span className="text-xs text-ink-400">{formatRelativeTime(post.createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{contentNode}</p>
      </div>
    </div>
  );
}
