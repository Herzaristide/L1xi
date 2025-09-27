import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { getInitials } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className='bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50 pwa-titlebar'>
      <div className='px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center pwa-safe-area'>
            {/* Mobile menu button */}
            <Button
              variant='ghost'
              size='sm'
              className='lg:hidden mr-2'
              onClick={onMenuClick}
            >
              <Menu className='h-5 w-5' />
            </Button>

            {/* Logo */}
            <div className='flex items-center'>
              <h1 className='text-2xl font-bold text-primary-600 pwa-app-title'>
                L1xi
              </h1>
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            {/* Notifications */}
            <Button variant='ghost' size='sm'>
              <Bell className='h-5 w-5' />
            </Button>

            {/* User menu */}
            <div className='relative' ref={dropdownRef}>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='flex items-center space-x-2'
              >
                <div className='w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium'>
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt='Avatar'
                      className='w-8 h-8 rounded-full'
                    />
                  ) : (
                    getInitials(
                      user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.username || 'U'
                    )
                  )}
                </div>
                <span className='hidden sm:block text-sm font-medium'>
                  {user?.firstName || user?.username}
                </span>
              </Button>

              {isDropdownOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50'>
                  <div className='px-4 py-2 border-b border-gray-200'>
                    <p className='text-sm font-medium text-gray-900'>
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.username}
                    </p>
                    <p className='text-sm text-gray-500'>{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      // Navigate to profile
                    }}
                    className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left'
                  >
                    <User className='mr-3 h-4 w-4' />
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left'
                  >
                    <LogOut className='mr-3 h-4 w-4' />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
