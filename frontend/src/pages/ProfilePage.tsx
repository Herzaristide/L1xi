import { useAuthStore } from '@/stores/authStore';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-64'>
        <div className='text-center'>
          <User className='h-12 w-12 mx-auto text-gray-400 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No user data available
          </h3>
          <p className='text-gray-500'>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return <div className='space-y-6'></div>;
}
