import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, Bell, Shield } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary-700">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{user?.name || 'User'}</h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-hover">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <p className="text-gray-600">Update your profile and preferences</p>
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
              <p className="text-gray-600">Manage your account and privacy settings</p>
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-gray-600">Configure your notification preferences</p>
            </div>
          </div>
        </div>

        <div className="card-hover">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
              <p className="text-gray-600">Manage your data and security settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <p className="text-gray-900">{user?.profile?.age || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <p className="text-gray-900 capitalize">{user?.profile?.gender || 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <p className="text-gray-900">
                {user?.profile?.weight ? `${user.profile.weight} kg` : 'Not specified'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height
              </label>
              <p className="text-gray-900">
                {user?.profile?.height ? `${user.profile.height} cm` : 'Not specified'}
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Level
            </label>
            <p className="text-gray-900 capitalize">
              {user?.profile?.activity_level?.replace('_', ' ') || 'Not specified'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {user?.profile?.dietary_preferences?.length > 0 ? (
                user.profile.dietary_preferences.map((pref) => (
                  <span
                    key={pref}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm capitalize"
                  >
                    {pref.replace('_', ' ')}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">None specified</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Health Goals
            </label>
            <div className="flex flex-wrap gap-2">
              {user?.profile?.health_goals?.length > 0 ? (
                user.profile.health_goals.map((goal) => (
                  <span
                    key={goal}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize"
                  >
                    {goal.replace('_', ' ')}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">None specified</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button className="btn-primary">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
