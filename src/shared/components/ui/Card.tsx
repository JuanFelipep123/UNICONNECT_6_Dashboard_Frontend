import clsx from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return <div className={clsx('rounded-2xl border border-ink-100 bg-white p-5 shadow-sm', className)}>{children}</div>;
}
