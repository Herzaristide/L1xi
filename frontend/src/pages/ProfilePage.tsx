import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/FlipCardold';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  User,
  LogOut,
  Edit,
  Save,
  X,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateProfile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const handleDisconnect = () => {
    logout();
    navigate('/auth/login');
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      // Error is already handled by the store
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
