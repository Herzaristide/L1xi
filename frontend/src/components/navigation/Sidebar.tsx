import { NavLink, useLocation } from 'react-router-dom';
import { Brain, BookOpen, BarChart3, Settings, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {}

const navigation = [
  { name: 'Home', href: '/', icon: Brain },
  { name: 'Library', href: '/library', icon: CreditCard },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Decks', href: '/decks', icon: BookOpen },
  { name: 'Profile', href: '/profile', icon: Settings },
];

export default function Sidebar({}: SidebarProps) {
  const location = useLocation();
  return (
    <nav className={'fixed bottom-0 w-full flex justify-center gap-8 p-4'}>
      {navigation.map((item) => {
        const isActive =
          item.href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.href);

        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center rounded-md text-sm font-medium transition-all duration-200 group bg-black/10 p-2',

              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon
              className={cn(
                'h-8 w-8',

                isActive
                  ? 'text-primary-600'
                  : 'text-gray-400 group-hover:text-gray-600'
              )}
            />
          </NavLink>
        );
      })}
    </nav>
  );
}
