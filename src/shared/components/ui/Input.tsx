import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
      {label}
      <input
        className={clsx(
          'rounded-xl border border-ink-300 px-3 py-2.5 text-sm text-ink-900 outline-none ring-brand-500 transition focus:ring-2',
          className,
        )}
        {...props}
      />
    </label>
  );
}
