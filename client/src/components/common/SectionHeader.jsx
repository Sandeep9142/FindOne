import { cn } from '@utils/cn';

export default function SectionHeader({
  overline,
  title,
  subtitle,
  centered = true,
  dark = false,
  className,
}) {
  return (
    <div className={cn('max-w-2xl mb-14', centered && 'mx-auto text-center', className)}>
      {overline && (
        <span
          className={cn(
            'overline inline-block mb-3',
            dark && 'text-secondary-400'
          )}
        >
          {overline}
        </span>
      )}
      <h2
        className={cn(
          'text-heading-1 font-bold',
          dark ? 'text-white' : 'text-dark'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-4 text-body-lg',
            dark ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
