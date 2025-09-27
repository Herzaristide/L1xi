import { Language } from '@/lib/services/types';

interface LanguageFlagProps {
  language?: Language;
  className?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LanguageFlag({
  language,
  className = '',
  showName = false,
  size = 'sm',
}: LanguageFlagProps) {
  if (!language) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-2',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-gray-100 ${sizeClasses[size]} ${className}`}
      title={`${language.name} (${language.id})`}
    >
      {language.flag && (
        <span className='text-sm' role='img' aria-label={language.name}>
          {language.flag}
        </span>
      )}
      {showName && (
        <span className='font-medium text-gray-700'>{language.name}</span>
      )}
      {!showName && (
        <span className='font-medium text-gray-700 uppercase text-xs'>
          {language.id}
        </span>
      )}
    </div>
  );
}
