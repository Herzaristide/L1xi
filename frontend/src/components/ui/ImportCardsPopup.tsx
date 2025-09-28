import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ColumnMapping {
  front?: string;
  back?: string;
  frontLanguageId?: string;
  backLanguageId?: string;
}

interface FileData {
  headers: string[];
  rows: string[][];
  preview: string[][];
}

interface ImportCardsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
}

export default function ImportCardsPopup({
  isOpen,
  onClose,
  onImport,
}: ImportCardsPopupProps) {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [fileName, setFileName] = useState('');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pastedData, setPastedData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when popup opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFileData(null);
      setFileName('');
      setColumnMapping({});
      setIsImporting(false);
      setError('');
      setInputMode('file');
      setPastedData('');
    }
  }, [isOpen]);

  const parseCSV = (text: string): FileData => {
    const lines = text.trim().split('\n');
    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines
      .slice(1)
      .map((line) =>
        line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
      );

    return {
      headers,
      rows,
      preview: rows.slice(0, 5), // Show first 5 rows as preview
    };
  };

  const parseJSON = (text: string): FileData => {
    const data = JSON.parse(text);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('JSON must be an array of objects');
    }

    const headers = Object.keys(data[0]);
    const rows = data.map((item) =>
      headers.map((header) => String(item[header] || ''))
    );

    return {
      headers,
      rows,
      preview: rows.slice(0, 5),
    };
  };

  const parseExcel = async (_file: File): Promise<FileData> => {
    // For now, we'll handle Excel files as CSV after conversion
    // In a real app, you'd use a library like SheetJS/xlsx
    throw new Error(
      'Excel support requires additional libraries. Please convert to CSV format.'
    );
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError('');
      setFileName(file.name);

      const extension = file.name.split('.').pop()?.toLowerCase();

      try {
        let parsedData: FileData;

        if (extension === 'csv') {
          const text = await file.text();
          parsedData = parseCSV(text);
        } else if (extension === 'json') {
          const text = await file.text();
          parsedData = parseJSON(text);
        } else if (extension === 'xlsx' || extension === 'xls') {
          parsedData = await parseExcel(file);
        } else {
          throw new Error(
            'Unsupported file type. Please use CSV, JSON, or Excel files.'
          );
        }

        setFileData(parsedData);

        // Auto-map common column names
        const mapping: ColumnMapping = {};
        parsedData.headers.forEach((header) => {
          const lowerHeader = header.toLowerCase();
          if (
            lowerHeader.includes('front') ||
            lowerHeader.includes('question')
          ) {
            mapping.front = header;
          } else if (
            lowerHeader.includes('back') ||
            lowerHeader.includes('answer')
          ) {
            mapping.back = header;
          } else if (
            lowerHeader.includes('frontlanguage') ||
            lowerHeader.includes('front_language') ||
            lowerHeader.includes('sourcelanguage') ||
            lowerHeader.includes('source_language')
          ) {
            mapping.frontLanguageId = header;
          } else if (
            lowerHeader.includes('backlanguage') ||
            lowerHeader.includes('back_language') ||
            lowerHeader.includes('targetlanguage') ||
            lowerHeader.includes('target_language')
          ) {
            mapping.backLanguageId = header;
          }
        });

        setColumnMapping(mapping);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    },
    []
  );

  const handlePastedDataProcess = useCallback(() => {
    if (!pastedData.trim()) {
      setError('Please paste some data first');
      return;
    }

    setError('');

    try {
      let parsedData: FileData;
      const trimmedData = pastedData.trim();

      // Try to detect if it's JSON first
      if (trimmedData.startsWith('[') || trimmedData.startsWith('{')) {
        try {
          parsedData = parseJSON(trimmedData);
          setFileName('Pasted JSON data');
        } catch {
          // If JSON parsing fails, try CSV
          parsedData = parseCSV(trimmedData);
          setFileName('Pasted CSV data');
        }
      } else {
        // Default to CSV parsing
        parsedData = parseCSV(trimmedData);
        setFileName('Pasted CSV data');
      }

      setFileData(parsedData);

      // Auto-map common column names
      const mapping: ColumnMapping = {};
      parsedData.headers.forEach((header) => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('front') || lowerHeader.includes('question')) {
          mapping.front = header;
        } else if (
          lowerHeader.includes('back') ||
          lowerHeader.includes('answer')
        ) {
          mapping.back = header;
        } else if (
          lowerHeader.includes('frontlanguage') ||
          lowerHeader.includes('front_language') ||
          lowerHeader.includes('sourcelanguage') ||
          lowerHeader.includes('source_language')
        ) {
          mapping.frontLanguageId = header;
        } else if (
          lowerHeader.includes('backlanguage') ||
          lowerHeader.includes('back_language') ||
          lowerHeader.includes('targetlanguage') ||
          lowerHeader.includes('target_language')
        ) {
          mapping.backLanguageId = header;
        }
      });

      setColumnMapping(mapping);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to parse pasted data'
      );
    }
  }, [pastedData]);

  const handleImportClick = async () => {
    if (!fileData || !columnMapping.front || !columnMapping.back) {
      setError('Please map at least the Front and Back columns');
      return;
    }

    setIsImporting(true);
    setError('');

    try {
      const cardsData = fileData.rows
        .map((row) => {
          const card: any = {};

          // Required fields
          card.front = columnMapping.front
            ? row[fileData.headers.indexOf(columnMapping.front)]
            : '';
          card.back = columnMapping.back
            ? row[fileData.headers.indexOf(columnMapping.back)]
            : '';

          // Optional language fields
          if (columnMapping.frontLanguageId) {
            card.frontLanguageId =
              row[fileData.headers.indexOf(columnMapping.frontLanguageId)] ||
              undefined;
          }

          if (columnMapping.backLanguageId) {
            card.backLanguageId =
              row[fileData.headers.indexOf(columnMapping.backLanguageId)] ||
              undefined;
          }

          // Set default values for other fields
          card.type = 'TRANSLATION';
          card.difficulty = 1;

          // Skip empty rows
          if (!card.front.trim() || !card.back.trim()) {
            return null;
          }

          return card;
        })
        .filter(Boolean);

      if (cardsData.length === 0) {
        throw new Error('No valid cards found in the file');
      }

      await onImport(cardsData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import cards');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              Import Cards
            </h2>
            <p className='text-sm text-gray-600 mt-1'>
              Upload files or paste CSV/JSON data to bulk import cards
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500 transition-colors'
            aria-label='Close import dialog'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-6'>
          {!fileData ? (
            // File Upload or Paste Section
            <div className='space-y-6'>
              {/* Input Mode Toggle */}
              <div className='flex justify-center'>
                <div className='flex rounded-lg bg-gray-100 p-1'>
                  <button
                    onClick={() => setInputMode('file')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      inputMode === 'file'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Upload className='h-4 w-4 mr-2 inline' />
                    Upload File
                  </button>
                  <button
                    onClick={() => setInputMode('paste')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      inputMode === 'paste'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText className='h-4 w-4 mr-2 inline' />
                    Paste Data
                  </button>
                </div>
              </div>

              {inputMode === 'file' ? (
                // File Upload Section
                <>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='.csv,.json,.xlsx,.xls'
                      onChange={handleFileSelect}
                      className='hidden'
                      aria-label='Select file to import cards'
                    />
                    <Upload className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      Choose a file to import
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      Supported formats: CSV, JSON, Excel (.xlsx, .xls)
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className='mx-auto'
                    >
                      <Upload className='h-4 w-4 mr-2' />
                      Select File
                    </Button>
                  </div>
                </>
              ) : (
                // Paste Data Section
                <>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <label className='block text-sm font-medium text-gray-700'>
                        CSV or JSON Data
                      </label>
                      <textarea
                        value={pastedData}
                        onChange={(e) => setPastedData(e.target.value)}
                        placeholder={`Paste your data here...\n\nCSV Example:\nfront,back,hint\n"Hello","Bonjour","French greeting"\n"Goodbye","Au revoir","French farewell"\n\nJSON Example:\n[{"front": "Hello", "back": "Bonjour", "hint": "French greeting"}]`}
                        className='w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm'
                      />
                    </div>

                    <div className='flex justify-end'>
                      <Button
                        onClick={handlePastedDataProcess}
                        disabled={!pastedData.trim()}
                      >
                        Process Data
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Column Mapping Section
            <div className='space-y-6'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <FileText className='h-5 w-5 text-gray-500' />
                  <span className='font-medium text-gray-900'>{fileName}</span>
                  <span className='text-sm text-gray-500'>
                    ({fileData.rows.length} rows)
                  </span>
                </div>
                <button
                  onClick={() => setFileData(null)}
                  className='text-sm text-primary-600 hover:text-primary-700'
                >
                  Choose different file
                </button>
              </div>

              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Map Your Columns
                </h3>
                <p className='text-sm text-gray-600 mb-4'>
                  Map your file columns to card fields. Front and Back are
                  required. Language IDs are optional.
                </p>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {[
                    { key: 'front', label: 'Front (Question)', required: true },
                    { key: 'back', label: 'Back (Answer)', required: true },
                    {
                      key: 'frontLanguageId',
                      label: 'Front Language ID',
                      required: false,
                    },
                    {
                      key: 'backLanguageId',
                      label: 'Back Language ID',
                      required: false,
                    },
                  ].map(({ key, label, required }) => (
                    <div key={key}>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {label}{' '}
                        {required && <span className='text-red-500'>*</span>}
                      </label>
                      <select
                        value={columnMapping[key as keyof ColumnMapping] || ''}
                        onChange={(e) =>
                          setColumnMapping((prev) => ({
                            ...prev,
                            [key]: e.target.value || undefined,
                          }))
                        }
                        className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                        aria-label={`Select column for ${label}`}
                      >
                        <option value=''>-- Select Column --</option>
                        {fileData.headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Preview ({fileData.preview.length} of {fileData.rows.length}{' '}
                  rows)
                </h3>
                <div className='border border-gray-200 rounded-lg overflow-hidden'>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          {fileData.headers.map((header) => (
                            <th
                              key={header}
                              className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {fileData.preview.map((row, index) => (
                          <tr key={index} className='hover:bg-gray-50'>
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className='px-4 py-3 text-sm text-gray-900 max-w-xs truncate'
                                title={cell}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {fileData && (
          <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50'>
            <Button variant='outline' onClick={onClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button
              onClick={handleImportClick}
              isLoading={isImporting}
              disabled={!columnMapping.front || !columnMapping.back}
            >
              Import {fileData.rows.length} Cards
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
