import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface ToolbarButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  text?: string;
  tone?: 'neutral' | 'primary' | 'danger';
}

export function ToolbarButton({
  icon,
  label,
  onClick,
  disabled = false,
  text,
  tone = 'neutral',
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border px-2.5 text-sm font-medium transition',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-950',
        tone === 'neutral' &&
          'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
        tone === 'primary' &&
          'border-teal-700 bg-teal-700 text-white hover:border-teal-800 hover:bg-teal-800',
        tone === 'danger' &&
          'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-white',
      )}
    >
      {icon}
      {text ? <span>{text}</span> : null}
    </button>
  );
}
