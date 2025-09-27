import { Language } from '@/lib/services/types';

interface LanguageFlagProps {
  language?: Language;
}

export function LanguageFlag({ language }: LanguageFlagProps) {
  return (
    <div
      className={`flex items-center rounded-full bg-gray-100 h-6 aspect-square justify-center`}
    >
      {language ? (
        <span className='text-sm' role='img' aria-label={language.name}>
          {language.flag}
        </span>
      ) : (
        'X'
      )}
    </div>
  );
}
