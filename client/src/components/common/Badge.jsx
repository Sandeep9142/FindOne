import { cn } from '@utils/cn';

const colorMap = {
  primary: 'bg-primary-50 text-primary-600 border-primary-200',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  teal: 'bg-teal-50 text-teal-600 border-teal-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  violet: 'bg-violet-50 text-violet-600 border-violet-200',
  pink: 'bg-pink-50 text-pink-600 border-pink-200',
  glow: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
};

export default function Badge({ children, color = 'primary', dot = false, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border',
        colorMap[color],
        className
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </span>
  );
}
