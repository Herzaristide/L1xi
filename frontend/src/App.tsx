import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import AuthLayout from '@/components/layouts/AuthLayout';
import MainLayout from '@/components/layouts/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import StudyPage from '@/pages/HomePage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LibraryPage from '@/pages/LibraryPage';
import Sidebar from '@/components/navigation/Sidebar';
import ProfilePage from '@/pages/ProfilePage';

function App() {
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <main className='flex p-8 w-screen h-screen'>
      <Routes>
        {!user && (
          <>
            <Route path='login' element={<LoginPage />} />
            <Route path='register' element={<RegisterPage />} />
            <Route path='*' element={<Navigate to='/login' replace />} />
          </>
        )}
        {user && (
          <>
            <Route path='/' index element={<StudyPage />} />
            <Route path='library' element={<LibraryPage />} />
            <Route path='profile' element={<ProfilePage />} />
            <Route path='/auth/*' element={<Navigate to='/' replace />} />
          </>
        )}
      </Routes>
      <Sidebar />
    </main>
  );
}

export default App;
