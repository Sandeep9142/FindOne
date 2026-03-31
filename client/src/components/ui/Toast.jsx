import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@utils/cn';

const typeConfig = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  error: { icon: AlertCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
};

export default function Toast({ message, type = 'success', duration = 4000, onClose }) {
  const [visible, setVisible] = useState(true);
  const { icon: Icon, bg, text } = typeConfig[type] || typeConfig.success;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300',
        bg,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      )}
    >
      <Icon size={18} className={text} />
      <span className={cn('text-sm font-medium', text)}>{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600">
        <X size={14} />
      </button>
    </div>
  );
}
