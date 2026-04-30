import { ChevronRight } from 'lucide-react';
import type { WallInboxItem } from '../../domain/wall';
import { formatRelativeTime } from '@shared/utils/time';

interface Props {
  item: WallInboxItem;
  onClick: () => void;
}

export function WallInboxItemRow({ item, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-ink-100 bg-white px-5 py-4 text-left shadow-sm transition hover:bg-brand-50"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-900">
        {item.groupName.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink-900">{item.groupName}</p>
        {item.lastPost ? (
          <p className="mt-0.5 truncate text-sm text-ink-500">
            <span className="font-medium text-ink-700">
              {item.lastPost.senderName ?? 'Alguien'}
            </span>
            {': '}
            {item.lastPost.content}
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-ink-300">Sin publicaciones aún</p>
        )}
      </div>

      {item.lastPost && (
        <span className="flex-shrink-0 text-xs text-ink-400">
          {formatRelativeTime(item.lastPost.createdAt)}
        </span>
      )}

      <ChevronRight size={16} className="flex-shrink-0 text-ink-300" />
    </button>
  );
}
