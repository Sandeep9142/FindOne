import { cn } from '@utils/cn';

const sizeMap = {
  sm: { text: 'text-lg', icon: 'h-7 w-7' },
  md: { text: 'text-xl', icon: 'h-9 w-9' },
  lg: { text: 'text-2xl', icon: 'h-12 w-12' },
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
      <img
        src="/findone-logo.png"
        alt="FindOne"
        className={cn('rounded-xl object-cover flex-shrink-0', icon)}
      />
      FindOne
    </span>
  );
}
