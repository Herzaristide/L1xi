import { useState } from 'react';
import { Keyboard } from '@/components/ui/Keyboard';

export default function KeyboardTestPage() {
  const [inputValue, setInputValue] = useState('');
  const [currentAlphabet, setCurrentAlphabet] = useState<
    'latin' | 'azerty' | 'cyrillic' | 'chinese' | 'japanese' | 'greek'
  >('latin');

  const handleKeyPress = (key: string) => {
    if (key === 'Backspace') {
      setInputValue((prev) => prev.slice(0, -1));
    } else if (key === 'Enter') {
      setInputValue((prev) => prev + '\\n');
    } else if (key === ' ' || key === 'Space') {
      setInputValue((prev) => prev + ' ');
    } else if (key === 'Tab') {
      setInputValue((prev) => prev + '    ');
    } else if (key.length === 1) {
      setInputValue((prev) => prev + key);
    }
  };

  const handleAlphabetChange = (alphabet: string) => {
    setCurrentAlphabet(alphabet as typeof currentAlphabet);
  };

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-center mb-8'>
          Virtual Keyboard Test
        </h1>

        {/* Input Display */}
        <div className='bg-white rounded-lg p-6 mb-8 shadow-sm'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Type using the virtual keyboard or your physical keyboard:
          </label>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className='w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Start typing...'
          />
          <div className='mt-4 flex justify-between items-center'>
            <div className='text-sm text-gray-500'>
              Characters: {inputValue.length}
            </div>
            <button
              onClick={() => setInputValue('')}
              className='px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors'
            >
              Clear
            </button>
          </div>
        </div>

        {/* Virtual Keyboard */}
        <div className='bg-white rounded-lg p-6 shadow-sm'>
          <h2 className='text-xl font-semibold mb-4 text-center'>
            Virtual Keyboard
          </h2>
          <Keyboard
            onKeyPress={handleKeyPress}
            onAlphabetChange={handleAlphabetChange}
            currentAlphabet={currentAlphabet}
            className='w-full'
          />
        </div>

        {/* Instructions */}
        <div className='mt-8 bg-blue-50 rounded-lg p-6'>
          <h3 className='text-lg font-medium text-blue-900 mb-3'>
            Test Features:
          </h3>
          <ul className='text-blue-800 space-y-1'>
            <li>
              • <strong>Physical Key Mapping:</strong> Press 'A' on your
              physical keyboard - it should highlight and type the correct
              character for the selected layout
            </li>
            <li>
              • <strong>Russian Test:</strong> Switch to Cyrillic, press 'A' →
              should type 'Ф' (physical A key maps to Ф position)
            </li>
            <li>
              • <strong>French Test:</strong> Switch to AZERTY, press 'Q' →
              should type 'A' (AZERTY layout)
            </li>
            <li>
              • <strong>Greek Test:</strong> Switch to Greek, press 'A' → should
              type 'Α'
            </li>
            <li>
              • <strong>Chinese Test:</strong> Switch to Chinese, type 'ni' →
              should show suggestions
            </li>
            <li>
              • <strong>Japanese Test:</strong> Switch to Japanese, enable
              Hiragana mode, type 'a' → should type 'あ'
            </li>
            <li>
              • <strong>Virtual Clicks:</strong> Click any virtual key → should
              type in the input field
            </li>
          </ul>
        </div>

        {/* Debug Info */}
        <div className='mt-4 bg-gray-100 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-gray-700 mb-2'>
            Debug Info:
          </h4>
          <div className='text-xs text-gray-600 font-mono'>
            Current Layout: {currentAlphabet}
            <br />
            Input Length: {inputValue.length}
            <br />
            Last 20 chars: {inputValue.slice(-20) || 'none'}
          </div>
        </div>
      </div>
    </div>
  );
}

export { KeyboardTestPage };
