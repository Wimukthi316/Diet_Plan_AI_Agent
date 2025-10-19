import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  MessageCircle,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react';
import { clsx } from 'clsx';
import FaviconIcon from './FaviconIcon';

const Layout = ({ children, sessions, activeSessionId, onSessionClick, onNewSession }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'AI Chat', href: '/chat', icon: MessageCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl border-r border-gray-100">
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-100">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center">
                <FaviconIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-800" style={{ fontFamily: 'Merienda, cursive' }}>Nutri</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 px-6 py-8 space-y-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isChatPage = item.href === '/chat';
              return (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      'flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium',
                      isActive
                        ? 'bg-green-800 text-white'
                        : 'text-gray-600'
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <item.icon className={clsx('w-6 h-6', isActive ? 'text-white' : 'text-gray-500')} />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    {isChatPage && isActive && sessions && sessions.length > 0 && (
                      <span className="text-xs bg-green-700 px-2 py-1 rounded-full">
                        {sessions.length}
                      </span>
                    )}
                  </Link>
                  
                  {/* Show chat history under AI Chat */}
                  {isChatPage && isActive && sessions && sessions.length > 0 && (
                    <div className="mt-2 ml-4 pl-6 border-l-2 border-green-300 space-y-1 max-h-60 overflow-y-auto">
                      {sessions.slice(0, 6).map((session) => (
                        <button
                          key={session.id}
                          onClick={(e) => {
                            e.preventDefault();
                            onSessionClick?.(session.id);
                            setSidebarOpen(false);
                          }}
                          className={clsx(
                            'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                            activeSessionId === session.id
                              ? 'bg-green-100 text-green-800 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          <div className="truncate">{session.title}</div>
                          <div className="text-xs text-gray-500">{session.message_count} msgs</div>
                        </button>
                      ))}
                      {sessions.length > 6 && (
                        <div className="text-xs text-gray-500 px-3 py-1">
                          +{sessions.length - 6} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="border-t border-gray-100 p-6">
            <Link
              to="/profile"
              className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg mb-3"
            >
              <User className="w-5 h-5" />
              <span>{user?.name || 'Profile'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium text-red-600 bg-red-50 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white shadow-lg border-r border-gray-100">
        <div className="flex h-20 items-center px-8 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center">
              <FaviconIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-green-800" style={{ fontFamily: 'Merienda, cursive' }}>Nutri</span>
          </Link>
        </div>
        <nav className="flex-1 px-6 py-8 space-y-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const isChatPage = item.href === '/chat';
            return (
              <div key={item.name}>
                <div className="group relative">
                  <Link
                    to={item.href}
                    className={clsx(
                      'flex items-center justify-between px-4 py-4 rounded-lg text-base font-medium',
                      isActive
                        ? 'bg-green-800 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <item.icon className={clsx('w-6 h-6', isActive ? 'text-white' : 'text-gray-500')} />
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    {isChatPage && isActive && sessions && sessions.length > 0 && (
                      <span className="text-xs bg-green-700 px-2 py-1 rounded-full">
                        {sessions.length}
                      </span>
                    )}
                  </Link>
                  
                  {/* New Chat button for AI Chat */}
                  {isChatPage && isActive && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onNewSession?.();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-green-700 hover:bg-green-600 text-white p-1.5 rounded"
                      title="New Chat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Show chat history under AI Chat */}
                {isChatPage && isActive && sessions && sessions.length > 0 && (
                  <div className="mt-2 ml-4 pl-6 border-l-2 border-green-300 space-y-1 max-h-80 overflow-y-auto">
                    {sessions.slice(0, 8).map((session) => (
                      <button
                        key={session.id}
                        onClick={(e) => {
                          e.preventDefault();
                          onSessionClick?.(session.id);
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group',
                          activeSessionId === session.id
                            ? 'bg-green-100 text-green-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-3 h-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">{session.title}</div>
                            <div className="text-xs text-gray-500">{session.message_count} messages</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {sessions.length > 8 && (
                      <div className="text-xs text-gray-500 px-3 py-2 text-center italic">
                        +{sessions.length - 8} more chats
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-6">
          <Link
            to="/profile"
            className="flex items-center space-x-3 w-full px-4 py-4 text-base font-semibold text-gray-700 hover:bg-gray-100 rounded-lg mb-3"
          >
            <User className="w-6 h-6" />
            <span>{user?.name || 'Profile'}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-4 text-base font-semibold text-red-600 bg-red-50 rounded-lg"
          >
            <LogOut className="w-6 h-6" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
