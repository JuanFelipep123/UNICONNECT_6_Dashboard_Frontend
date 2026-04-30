import clsx from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ className, children, style }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border bg-white card-shadow',
        className,
      )}
      style={{ borderColor: '#E9ECEF', padding: '20px', ...style }}
    >
      {children}
    </div>
  );
}
