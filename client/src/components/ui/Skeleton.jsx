import { cn } from '@utils/cn';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('bg-slate-200 rounded-lg animate-pulse', className)}
      {...props}
    />
  );
}
