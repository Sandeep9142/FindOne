import { cn } from '@utils/cn';

export default function Spinner({ size = 'md', className }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div
      className={cn(
        'border-4 border-primary-500 border-t-transparent rounded-full animate-spin',
        sizeMap[size],
        className
      )}
    />
  );
}
