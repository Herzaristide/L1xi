import { useState, useEffect, useCallback } from 'react';
import './keyboard.css';

// Physical keyboard layout mapping (QWERTY positions)
const PHYSICAL_KEY_POSITIONS: Record<string, [number, number]> = {
  // Row 0 (numbers)
  Backquote: [0, 0],
  Digit1: [0, 1],
  Digit2: [0, 2],
  Digit3: [0, 3],
  Digit4: [0, 4],
  Digit5: [0, 5],
  Digit6: [0, 6],
  Digit7: [0, 7],
  Digit8: [0, 8],
  Digit9: [0, 9],
  Digit0: [0, 10],
  Minus: [0, 11],
  Equal: [0, 12],

  // Row 1 (QWERTY top row)
  KeyQ: [1, 0],
  KeyW: [1, 1],
  KeyE: [1, 2],
  KeyR: [1, 3],
  KeyT: [1, 4],
  KeyY: [1, 5],
  KeyU: [1, 6],
  KeyI: [1, 7],
  KeyO: [1, 8],
  KeyP: [1, 9],
  BracketLeft: [1, 10],
  BracketRight: [1, 11],
  Backslash: [1, 12],

  // Row 2 (ASDF home row)
  KeyA: [2, 0],
  KeyS: [2, 1],
  KeyD: [2, 2],
  KeyF: [2, 3],
  KeyG: [2, 4],
  KeyH: [2, 5],
  KeyJ: [2, 6],
  KeyK: [2, 7],
  KeyL: [2, 8],
  Semicolon: [2, 9],
  Quote: [2, 10],

  // Row 3 (ZXCV bottom row)
  KeyZ: [3, 0],
  KeyX: [3, 1],
  KeyC: [3, 2],
  KeyV: [3, 3],
  KeyB: [3, 4],
  KeyN: [3, 5],
  KeyM: [3, 6],
  Comma: [3, 7],
  Period: [3, 8],
  Slash: [3, 9],
};

// Keyboard layouts for different alphabets
const KEYBOARD_LAYOUTS: Record<string, KeyboardLayout> = {
  latin: {
    name: 'Latin (QWERTY)',
    rows: [
      ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
    ],
    shiftRows: [
      ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?'],
    ],
  },
  azerty: {
    name: 'AZERTY (French)',
    rows: [
      ['²', '&', 'é', '"', "'", '(', '-', 'è', '_', 'ç', 'à', ')', '='],
      ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '^', '$', '*'],
      ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'ù'],
      ['w', 'x', 'c', 'v', 'b', 'n', ',', ';', ':', '!'],
    ],
    shiftRows: [
      ['³', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '°', '+'],
      ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '¨', '£', 'µ'],
      ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', '%'],
      ['W', 'X', 'C', 'V', 'B', 'N', '?', '.', '/', '§'],
    ],
  },
  cyrillic: {
    name: 'Cyrillic (Russian)',
    rows: [
      ['ё', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
      ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ', '\\'],
      ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
      ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '.'],
    ],
    shiftRows: [
      ['Ё', '!', '"', '№', ';', '%', ':', '?', '*', '(', ')', '_', '+'],
      ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ', '/'],
      ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
      ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю', ','],
    ],
  },
  greek: {
    name: 'Greek',
    rows: [
      ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
      ['ς', 'ω', 'ε', 'ρ', 'τ', 'υ', 'θ', 'ι', 'ο', 'π', '[', ']', '\\'],
      ['α', 'σ', 'δ', 'φ', 'γ', 'η', 'ξ', 'κ', 'λ', ';', "'"],
      ['ζ', 'χ', 'ψ', 'ω', 'β', 'ν', 'μ', ',', '.', '/'],
    ],
    shiftRows: [
      ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
      ['Σ', 'Ω', 'Ε', 'Ρ', 'Τ', 'Υ', 'Θ', 'Ι', 'Ο', 'Π', '{', '}', '|'],
      ['Α', 'Σ', 'Δ', 'Φ', 'Γ', 'Η', 'Ξ', 'Κ', 'Λ', ':', '"'],
      ['Ζ', 'Χ', 'Ψ', 'Ω', 'Β', 'Ν', 'Μ', '<', '>', '?'],
    ],
  },
};

// Special keys that don't change with alphabet
const SPECIAL_KEYS = {
  space: ' ',
  tab: 'Tab',
  enter: 'Enter',
  shift: 'Shift',
  ctrl: 'Ctrl',
  alt: 'Alt',
  backspace: 'Backspace',
  delete: 'Delete',
  capslock: 'CapsLock',
};

// Chinese Pinyin input suggestions (simplified for demo)
const PINYIN_SUGGESTIONS: Record<string, string[]> = {
  ni: ['你', '泥', '逆'],
  hao: ['好', '号', '豪'],
  ma: ['吗', '马', '妈'],
  wo: ['我', '卧', '握'],
  de: ['的', '得', '德'],
  shi: ['是', '师', '时'],
  zhe: ['这', '者', '着'],
  ge: ['个', '各', '格'],
  le: ['了', '乐', '勒'],
  ta: ['他', '她', '它'],
};

// Japanese Romaji to Hiragana mapping (basic)
const ROMAJI_TO_HIRAGANA: Record<string, string> = {
  a: 'あ',
  i: 'い',
  u: 'う',
  e: 'え',
  o: 'お',
  ka: 'か',
  ki: 'き',
  ku: 'く',
  ke: 'け',
  ko: 'こ',
  sa: 'さ',
  si: 'し',
  su: 'す',
  se: 'せ',
  so: 'そ',
  ta: 'た',
  ti: 'ち',
  tu: 'つ',
  te: 'て',
  to: 'と',
  na: 'な',
  ni: 'に',
  nu: 'ぬ',
  ne: 'ね',
  no: 'の',
  ha: 'は',
  hi: 'ひ',
  hu: 'ふ',
  he: 'へ',
  ho: 'ほ',
  ma: 'ま',
  mi: 'み',
  mu: 'む',
  me: 'め',
  mo: 'も',
  ya: 'や',
  yu: 'ゆ',
  yo: 'よ',
  ra: 'ら',
  ri: 'り',
  ru: 'る',
  re: 'れ',
  ro: 'ろ',
  wa: 'わ',
  wo: 'を',
  n: 'ん',
};

// Keyboard layout interface
interface KeyboardLayout {
  name: string;
  rows: string[][];
  shiftRows: string[][];
  inputMethod?: string;
  hiraganaMode?: boolean;
}

// Keyboard layouts for different alphabets

interface KeyboardProps {
  onKeyPress?: (key: string) => void;
  onAlphabetChange?: (alphabet: string) => void;
  className?: string;
  disabled?: boolean;
  currentAlphabet?: keyof typeof KEYBOARD_LAYOUTS;
}

export default function Keyboard({
  onKeyPress,
  onAlphabetChange,
  className = '',
  disabled = false,
  currentAlphabet = 'latin',
}: KeyboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [alphabet, setAlphabet] =
    useState<keyof typeof KEYBOARD_LAYOUTS>(currentAlphabet);

  // Asian input method states
  const [isHiraganaMode, setIsHiraganaMode] = useState(false);
  const [pinyinBuffer, setPinyinBuffer] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);

  const currentLayout = KEYBOARD_LAYOUTS[alphabet];
  const displayRows =
    isShiftPressed || isCapsLockOn
      ? currentLayout.shiftRows
      : currentLayout.rows;

  // Handle physical keyboard events
  const handlePhysicalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Handle special keys by their key value
      const key = event.key.toLowerCase();
      if (['shift', 'capslock', 'control', 'alt', 'meta'].includes(key)) {
        setActiveKeys((prev) => new Set([...prev, key]));

        if (key === 'shift') {
          setIsShiftPressed(true);
        }
        if (key === 'capslock') {
          setIsCapsLockOn((prev) => !prev);
        }
        return;
      }

      // Map physical key position to virtual keyboard key
      const position = PHYSICAL_KEY_POSITIONS[event.code];
      if (position) {
        const [row, col] = position;
        if (currentLayout.rows[row] && currentLayout.rows[row][col]) {
          const virtualKey =
            isShiftPressed || isCapsLockOn
              ? currentLayout.shiftRows[row][col]
              : currentLayout.rows[row][col];

          // Highlight the virtual key
          setActiveKeys((prev) => new Set([...prev, `${row}-${col}`]));

          // Trigger key press for the virtual key
          onKeyPress?.(virtualKey);
        }
      } else {
        // Handle special keys like Space, Enter, Backspace
        if (event.code === 'Space') {
          setActiveKeys((prev) => new Set([...prev, 'space']));
          onKeyPress?.(' ');
        } else if (event.code === 'Enter') {
          setActiveKeys((prev) => new Set([...prev, 'enter']));
          onKeyPress?.('Enter');
        } else if (event.code === 'Backspace') {
          setActiveKeys((prev) => new Set([...prev, 'backspace']));
          onKeyPress?.('Backspace');
        } else if (event.code === 'Tab') {
          event.preventDefault();
          setActiveKeys((prev) => new Set([...prev, 'tab']));
          onKeyPress?.('Tab');
        }
      }
    },
    [disabled, onKeyPress, currentLayout, isShiftPressed, isCapsLockOn]
  );

  const handlePhysicalKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    // Handle special keys
    if (['shift', 'capslock', 'control', 'alt', 'meta'].includes(key)) {
      setActiveKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      if (key === 'shift') {
        setIsShiftPressed(false);
      }
      return;
    }

    // Handle positioned keys
    const position = PHYSICAL_KEY_POSITIONS[event.code];
    if (position) {
      const [row, col] = position;
      setActiveKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`${row}-${col}`);
        return newSet;
      });
    } else {
      // Handle special keys
      const specialKeyMap: Record<string, string> = {
        Space: 'space',
        Enter: 'enter',
        Backspace: 'backspace',
        Tab: 'tab',
      };

      const specialKey = specialKeyMap[event.code];
      if (specialKey) {
        setActiveKeys((prev) => {
          const newSet = new Set(prev);
          newSet.delete(specialKey);
          return newSet;
        });
      }
    }
  }, []);

  // Add event listeners for physical keyboard
  useEffect(() => {
    window.addEventListener('keydown', handlePhysicalKeyDown);
    window.addEventListener('keyup', handlePhysicalKeyUp);

    return () => {
      window.removeEventListener('keydown', handlePhysicalKeyDown);
      window.removeEventListener('keyup', handlePhysicalKeyUp);
    };
  }, [handlePhysicalKeyDown, handlePhysicalKeyUp]);

  // Handle virtual key clicks
  const handleVirtualKeyPress = (key: string, originalKey?: string) => {
    if (disabled) return;

    // Simulate key press visual feedback
    const keyToHighlight = originalKey || key.toLowerCase();
    setActiveKeys((prev) => new Set([...prev, keyToHighlight]));

    // Remove highlight after short delay
    setTimeout(() => {
      setActiveKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(keyToHighlight);
        return newSet;
      });
    }, 100);

    // Handle special virtual key behaviors
    if (key === SPECIAL_KEYS.shift) {
      setIsShiftPressed((prev) => !prev);
      return;
    }
    if (key === SPECIAL_KEYS.capslock) {
      setIsCapsLockOn((prev) => !prev);
      return;
    }

    // Handle input method specific logic
    const layout = KEYBOARD_LAYOUTS[alphabet];

    // Chinese Pinyin input method
    if (
      alphabet === 'chinese' &&
      'inputMethod' in layout &&
      layout.inputMethod === 'pinyin'
    ) {
      if (key === 'Backspace') {
        if (pinyinBuffer.length > 0) {
          const newBuffer = pinyinBuffer.slice(0, -1);
          setPinyinBuffer(newBuffer);
          if (newBuffer.length === 0) {
            setShowSuggestions(false);
            setCurrentSuggestions([]);
          } else {
            const suggestions = PINYIN_SUGGESTIONS[newBuffer] || [];
            setCurrentSuggestions(suggestions);
            setShowSuggestions(suggestions.length > 0);
          }
          return;
        }
      } else if (key === 'Enter' && pinyinBuffer.length > 0) {
        // Confirm first suggestion or send pinyin as-is
        const finalText = currentSuggestions[0] || pinyinBuffer;
        onKeyPress?.(finalText);
        setPinyinBuffer('');
        setShowSuggestions(false);
        setCurrentSuggestions([]);
        return;
      } else if (key === ' ' && pinyinBuffer.length > 0) {
        // Space confirms the first suggestion
        const finalText = currentSuggestions[0] || pinyinBuffer;
        onKeyPress?.(finalText);
        setPinyinBuffer('');
        setShowSuggestions(false);
        setCurrentSuggestions([]);
        onKeyPress?.(' '); // Also add the space
        return;
      } else if (/^[1-9]$/.test(key) && showSuggestions) {
        // Number key selection for Chinese suggestions
        const index = parseInt(key) - 1;
        if (currentSuggestions[index]) {
          onKeyPress?.(currentSuggestions[index]);
          setPinyinBuffer('');
          setShowSuggestions(false);
          setCurrentSuggestions([]);
          return;
        }
      } else if (/^[a-z]$/.test(key)) {
        // Regular letter - add to pinyin buffer
        const newBuffer = pinyinBuffer + key;
        setPinyinBuffer(newBuffer);
        const suggestions = PINYIN_SUGGESTIONS[newBuffer] || [];
        setCurrentSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
        return;
      }
    }

    // Japanese Romaji input method
    if (
      alphabet === 'japanese' &&
      'inputMethod' in layout &&
      layout.inputMethod === 'romaji' &&
      isHiraganaMode
    ) {
      if (/^[a-z]$/.test(key)) {
        // Try to convert romaji to hiragana
        const hiragana = ROMAJI_TO_HIRAGANA[key];
        if (hiragana) {
          onKeyPress?.(hiragana);
          return;
        }
        // For multi-character romaji, we would need a buffer system similar to Chinese
      }
    }

    // Default behavior for all other keys
    onKeyPress?.(key);
  };

  // Handle alphabet switching
  const handleAlphabetSwitch = (newAlphabet: keyof typeof KEYBOARD_LAYOUTS) => {
    setAlphabet(newAlphabet);
    onAlphabetChange?.(newAlphabet);
  };

  // Get key class based on state
  const getKeyClass = (
    key: string,
    _originalKey?: string,
    row?: number,
    col?: number
  ) => {
    // Check if key is active (either by position or special key name)
    let isActive = false;
    if (row !== undefined && col !== undefined) {
      isActive = activeKeys.has(`${row}-${col}`);
    } else {
      // Special keys
      const specialKeyMap: Record<string, string> = {
        [SPECIAL_KEYS.space]: 'space',
        [SPECIAL_KEYS.enter]: 'enter',
        [SPECIAL_KEYS.backspace]: 'backspace',
        [SPECIAL_KEYS.tab]: 'tab',
        [SPECIAL_KEYS.shift]: 'shift',
        [SPECIAL_KEYS.capslock]: 'capslock',
        [SPECIAL_KEYS.ctrl]: 'control',
        [SPECIAL_KEYS.alt]: 'alt',
      };
      isActive = activeKeys.has(specialKeyMap[key] || key.toLowerCase());
    }

    const isSpecialKey = Object.values(SPECIAL_KEYS).includes(key);

    let baseClass =
      'keyboard-key flex items-center justify-center rounded-md border text-sm font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-sans ';

    if (disabled) {
      baseClass +=
        'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 ';
    } else if (isActive) {
      baseClass +=
        'bg-primary-600 text-white border-primary-600 shadow-lg transform scale-95 ';
    } else if (isSpecialKey) {
      baseClass +=
        'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 shadow-sm ';
    } else {
      baseClass +=
        'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-sm hover:border-gray-400 ';
    }

    // Size classes
    if (key === SPECIAL_KEYS.space) {
      baseClass += 'h-11 flex-1 mx-2 ';
    } else if (
      key === SPECIAL_KEYS.shift ||
      key === SPECIAL_KEYS.enter ||
      key === SPECIAL_KEYS.backspace
    ) {
      baseClass += 'h-11 px-4 min-w-[4rem] ';
    } else if (key === SPECIAL_KEYS.tab || key === SPECIAL_KEYS.capslock) {
      baseClass += 'h-11 px-3 min-w-[3.5rem] ';
    } else {
      baseClass += 'h-11 w-11 min-w-[2.75rem] ';
    }

    return baseClass;
  };

  return (
    <div
      className={`keyboard-container bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}
    >
      {/* Alphabet Selector */}
      <div className='mb-6 flex justify-center gap-2 flex-wrap'>
        {Object.entries(KEYBOARD_LAYOUTS).map(([key, layout]) => (
          <button
            key={key}
            onClick={() =>
              handleAlphabetSwitch(key as keyof typeof KEYBOARD_LAYOUTS)
            }
            disabled={disabled}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              alphabet === key
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {layout.name}
          </button>
        ))}
      </div>

      {/* Keyboard Layout */}
      <div className='keyboard-layout space-y-3'>
        {/* Number Row */}
        <div className='keyboard-row flex gap-1.5 justify-center'>
          {displayRows[0].map((key, index) => (
            <button
              key={`num-${index}`}
              onClick={() =>
                handleVirtualKeyPress(key, currentLayout.rows[0][index])
              }
              disabled={disabled}
              className={getKeyClass(
                key,
                currentLayout.rows[0][index],
                0,
                index
              )}
            >
              {key}
            </button>
          ))}
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.backspace)}
            disabled={disabled}
            className={getKeyClass(SPECIAL_KEYS.backspace)}
          >
            ⌫
          </button>
        </div>

        {/* Top Letter Row */}
        <div className='keyboard-row flex gap-1.5 justify-center'>
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.tab)}
            disabled={disabled}
            className={getKeyClass(SPECIAL_KEYS.tab)}
          >
            Tab
          </button>
          {displayRows[1].map((key, index) => (
            <button
              key={`top-${index}`}
              onClick={() =>
                handleVirtualKeyPress(key, currentLayout.rows[1][index])
              }
              disabled={disabled}
              className={getKeyClass(
                key,
                currentLayout.rows[1][index],
                1,
                index
              )}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Home Row */}
        <div className='keyboard-row flex gap-1.5 justify-center'>
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.capslock)}
            disabled={disabled}
            className={`${getKeyClass(SPECIAL_KEYS.capslock)} ${
              isCapsLockOn
                ? '!bg-warning-500 !text-white !border-warning-500'
                : ''
            }`}
          >
            Caps
          </button>
          {displayRows[2].map((key, index) => (
            <button
              key={`home-${index}`}
              onClick={() =>
                handleVirtualKeyPress(key, currentLayout.rows[2][index])
              }
              disabled={disabled}
              className={getKeyClass(
                key,
                currentLayout.rows[2][index],
                2,
                index
              )}
            >
              {key}
            </button>
          ))}
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.enter)}
            disabled={disabled}
            className={getKeyClass(SPECIAL_KEYS.enter)}
          >
            Enter
          </button>
        </div>

        {/* Bottom Letter Row */}
        <div className='keyboard-row flex gap-1.5 justify-center'>
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.shift)}
            disabled={disabled}
            className={`${getKeyClass(SPECIAL_KEYS.shift)} ${
              isShiftPressed ? 'bg-blue-400 text-white' : ''
            }`}
          >
            Shift
          </button>
          {displayRows[3].map((key, index) => (
            <button
              key={`bottom-${index}`}
              onClick={() =>
                handleVirtualKeyPress(key, currentLayout.rows[3][index])
              }
              disabled={disabled}
              className={getKeyClass(
                key,
                currentLayout.rows[3][index],
                3,
                index
              )}
            >
              {key}
            </button>
          ))}
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.shift)}
            disabled={disabled}
            className={`${getKeyClass(SPECIAL_KEYS.shift)} ${
              isShiftPressed
                ? '!bg-primary-500 !text-white !border-primary-500'
                : ''
            }`}
          >
            Shift
          </button>
        </div>

        {/* Space Bar Row */}
        <div className='keyboard-row flex gap-1.5 justify-center'>
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.ctrl)}
            disabled={disabled}
            className={getKeyClass(SPECIAL_KEYS.ctrl)}
          >
            Ctrl
          </button>
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.alt)}
            disabled={disabled}
            className={getKeyClass(SPECIAL_KEYS.alt)}
          >
            Alt
          </button>
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.space)}
            disabled={disabled}
            className={getKeyClass(SPECIAL_KEYS.space)}
          >
            Space
          </button>
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.alt)}
            disabled={disabled}
            className={getKeyClass(SPECIAL_KEYS.alt)}
          >
            Alt
          </button>
          <button
            onClick={() => handleVirtualKeyPress(SPECIAL_KEYS.ctrl)}
            disabled={disabled}
            className={getKeyClass(SPECIAL_KEYS.ctrl)}
          >
            Ctrl
          </button>
        </div>
      </div>

      {/* Chinese Pinyin Suggestions */}
      {alphabet === 'chinese' &&
        showSuggestions &&
        currentSuggestions.length > 0 && (
          <div className='mt-6 p-4 bg-warning-50 rounded-lg border border-warning-200'>
            <div className='text-sm text-gray-700 mb-3'>
              Pinyin:{' '}
              <span className='font-mono font-semibold'>{pinyinBuffer}</span>
            </div>
            <div className='flex gap-2 flex-wrap'>
              {currentSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onKeyPress?.(suggestion);
                    setPinyinBuffer('');
                    setShowSuggestions(false);
                    setCurrentSuggestions([]);
                  }}
                  className='px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-primary-50 hover:border-primary-300 text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                  disabled={disabled}
                >
                  {index + 1}. {suggestion}
                </button>
              ))}
            </div>
            <div className='text-xs text-gray-500 mt-2'>
              Press number key, Enter, or Space to select • Backspace to edit
            </div>
          </div>
        )}

      {/* Japanese Input Method Controls */}
      {alphabet === 'japanese' && (
        <div className='mt-6 flex justify-center'>
          <button
            onClick={() => setIsHiraganaMode(!isHiraganaMode)}
            disabled={disabled}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              isHiraganaMode
                ? 'bg-success-500 text-white hover:bg-success-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isHiraganaMode ? 'ひらがな (ON)' : 'Romaji (OFF)'}
          </button>
        </div>
      )}

      {/* Status Indicators */}
      <div className='mt-6 flex justify-center gap-3 text-xs text-gray-600 flex-wrap'>
        <span
          className={`px-3 py-1.5 rounded-full font-medium ${
            isCapsLockOn
              ? 'bg-warning-100 text-warning-700 border border-warning-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          Caps Lock {isCapsLockOn ? 'ON' : 'OFF'}
        </span>
        <span
          className={`px-3 py-1.5 rounded-full font-medium ${
            isShiftPressed
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          Shift {isShiftPressed ? 'ON' : 'OFF'}
        </span>
        <span className='px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium'>
          Layout: {currentLayout.name}
        </span>
        {alphabet === 'chinese' && (
          <span className='px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium'>
            Pinyin Mode
          </span>
        )}
        {alphabet === 'japanese' && (
          <span
            className={`px-3 py-1.5 rounded-full font-medium ${
              isHiraganaMode
                ? 'bg-success-100 text-success-700 border border-success-200'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {isHiraganaMode ? 'ひらがな' : 'Romaji'}
          </span>
        )}
      </div>
    </div>
  );
}

export { Keyboard };
