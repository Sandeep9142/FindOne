import { cn } from '@utils/cn';

export default function Card({ children, className, hover = true, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-100 p-6 transition-all duration-300',
        hover && 'hover:shadow-lg hover:border-slate-200 hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
