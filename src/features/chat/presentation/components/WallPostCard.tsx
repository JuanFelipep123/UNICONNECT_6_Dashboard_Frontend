import type { WallPost } from '../../domain/wall';
import { formatRelativeTime } from '@shared/utils/time';

interface Props {
  post: WallPost;
}

export function WallPostCard({ post }: Props) {
  const initials = (post.senderName ?? 'U').charAt(0).toUpperCase();

  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-900">
        {initials}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-ink-900">{post.senderName ?? 'Usuario'}</span>
          <span className="text-xs text-ink-400">{formatRelativeTime(post.createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{post.content}</p>
      </div>
    </div>
  );
}
