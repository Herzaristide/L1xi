import { Wifi, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='max-w-md w-full text-center'>
        <div className='mb-8'>
          <div className='mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4'>
            <WifiOff className='w-12 h-12 text-orange-600' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            You're Offline
          </h1>
          <p className='text-gray-600 mb-8'>
            No internet connection found. Some features may not be available.
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-3'>
            Available Offline:
          </h2>
          <ul className='text-left space-y-2 text-gray-600'>
            <li className='flex items-center'>
              <div className='w-2 h-2 bg-green-500 rounded-full mr-3'></div>
              View your downloaded decks
            </li>
            <li className='flex items-center'>
              <div className='w-2 h-2 bg-green-500 rounded-full mr-3'></div>
              Study cached flashcards
            </li>
            <li className='flex items-center'>
              <div className='w-2 h-2 bg-green-500 rounded-full mr-3'></div>
              Review your progress
            </li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className='w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2'
        >
          <Wifi className='w-5 h-5' />
          Try Reconnecting
        </button>

        <p className='text-sm text-gray-500 mt-4'>
          Your progress will sync when you're back online
        </p>
      </div>
    </div>
  );
}
