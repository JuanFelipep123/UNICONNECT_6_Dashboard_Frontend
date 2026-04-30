import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <label
      htmlFor={inputId}
      className="flex flex-col gap-1.5 text-sm font-medium"
      style={{ color: '#43474e' }}
    >
      {label}
      <input
        id={inputId}
        className={clsx(
          'rounded-xl border px-3 py-2.5 text-sm outline-none transition-all duration-150',
          className,
        )}
        style={{
          borderColor: '#CED4DA',
          color: '#1b1c1c',
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLInputElement).style.borderColor = '#00284D';
          (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(0,40,77,0.10)';
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLInputElement).style.borderColor = '#CED4DA';
          (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
        }}
        {...props}
      />
    </label>
  );
}
