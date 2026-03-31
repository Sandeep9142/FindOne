import { cn } from '@utils/cn';

const variants = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-primary active:bg-primary-700',
  gradient:
    'bg-gradient-primary text-white hover:opacity-90 shadow-primary active:opacity-80',
  secondary:
    'bg-secondary-500 text-white hover:bg-secondary-600 shadow-sm active:bg-secondary-700',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  'ghost-white':
    'bg-transparent text-white/90 hover:bg-white/10 active:bg-white/20',
  outline:
    'bg-transparent border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  'outline-white':
    'bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
};

const sizes = {
  sm: 'text-sm px-4 py-2 rounded-lg',
  md: 'text-sm px-5 py-2.5 rounded-lg',
  lg: 'text-base px-7 py-3 rounded-xl',
  xl: 'text-base px-8 py-3.5 rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  loading = false,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-semibold transition-all duration-200 cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
