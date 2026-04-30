import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        {
          // Navy primary (matches sidebar brand)
          'text-white': variant === 'primary',
          'bg-ink-100 text-ink-900 hover:bg-ink-200': variant === 'secondary',
          'bg-error text-white hover:opacity-90': variant === 'danger',
        },
        className,
      )}
      style={
        variant === 'primary'
          ? { background: '#00284D' }
          : undefined
      }
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          (e.currentTarget as HTMLButtonElement).style.background = '#00132a';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') {
          (e.currentTarget as HTMLButtonElement).style.background = '#00284D';
        }
      }}
      {...props}
    />
  );
}
