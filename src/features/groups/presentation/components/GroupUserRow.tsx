import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { UserProfileSummary } from '../../domain/groups';

interface GroupUserRowProps {
  person: UserProfileSummary;
  isAdmin?: boolean;
  description?: string;
  trailingContent?: ReactNode;
  className?: string;
}

export function GroupUserRow({ person, isAdmin = false, description, trailingContent, className }: GroupUserRowProps) {
  const avatarInitial = person.fullName.charAt(0).toUpperCase() || 'U';

  return (
    <li
      className={clsx(
        'flex flex-col gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3 sm:flex-row sm:items-center sm:justify-between',
        isAdmin && 'border-brand-200 bg-brand-50/60 ring-1 ring-brand-100',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt={person.fullName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-200 text-sm font-semibold text-ink-700">
            {avatarInitial}
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink-900">{person.fullName}</p>
            {isAdmin ? <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-900">Admin</span> : null}
          </div>
          {description ? <p className="text-xs text-ink-500">{description}</p> : null}
          <p className="text-xs text-ink-500">ID: {person.id}</p>
        </div>
      </div>

      {trailingContent ? <div className="flex items-center gap-2">{trailingContent}</div> : null}
    </li>
  );
}
