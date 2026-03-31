import { cn } from '@utils/cn';

const sizeMap = {
  sm: { text: 'text-xl', icon: 'w-6 h-6 text-[10px]' },
  md: { text: 'text-2xl', icon: 'w-7 h-7 text-[11px]' },
  lg: { text: 'text-3xl', icon: 'w-8 h-8 text-xs' },
};

export default function Logo({ variant = 'dark', size = 'md', className }) {
  const { text, icon } = sizeMap[size];
  const isWhite = variant === 'white';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-extrabold tracking-tight select-none',
        text,
        isWhite ? 'text-white' : 'text-dark',
        className
      )}
    >
      <span
        className={cn(
          'rounded-lg font-black flex items-center justify-center flex-shrink-0',
          icon,
          isWhite
            ? 'bg-white/15 text-white'
            : 'bg-gradient-primary text-white'
        )}
      >
        F
      </span>
      FindOne
    </span>
  );
}
