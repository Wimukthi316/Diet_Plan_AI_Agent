import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  MessageCircle,
  User,
  X,
  LogOut,
  Plus,
  Trash2,
  Pencil,
  Check,
  X as XIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import FaviconIcon from './FaviconIcon';

const Layout = ({ children, sessions, activeSessionId, onSessionClick, onNewSession, onDeleteSession, onRenameSession }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'AI Chat', href: '/chat', icon: MessageCircle },
  ];

  const startEditing = (session) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const saveTitle = async (sessionId) => {
    if (editingTitle.trim() && editingTitle !== sessions.find(s => s.id === sessionId)?.title) {
      await onRenameSession?.(sessionId, editingTitle.trim());
    }
    cancelEditing();
  };

  const handleKeyDown = (e, sessionId) => {
    if (e.key === 'Enter') {
      saveTitle(sessionId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

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
                        <div
                          key={session.id}
                          className={clsx(
                            'relative group rounded text-sm transition-colors',
                            activeSessionId === session.id
                              ? 'bg-green-100 text-green-800'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          {editingSessionId === session.id ? (
                            /* Edit mode */
                            <div className="flex items-center px-3 py-2 gap-1">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, session.id)}
                                onBlur={() => saveTitle(session.id)}
                                className="flex-1 px-2 py-1 text-sm border border-green-500 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                autoFocus
                              />
                              <button
                                onClick={() => saveTitle(session.id)}
                                className="p-1 hover:bg-green-200 rounded"
                                title="Save"
                              >
                                <Check className="w-3 h-3 text-green-600" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Cancel"
                              >
                                <XIcon className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                          ) : (
                            /* View mode */
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  onSessionClick?.(session.id);
                                  setSidebarOpen(false);
                                }}
                                className="w-full text-left px-3 py-2"
                              >
                                <div className="truncate font-medium">{session.title}</div>
                                <div className="text-xs text-gray-500">{session.message_count} msgs</div>
                              </button>
                              {/* Action buttons */}
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startEditing(session);
                                  }}
                                  className="p-1 hover:bg-blue-100 rounded"
                                  title="Rename chat"
                                >
                                  <Pencil className="w-3 h-3 text-blue-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (window.confirm('Delete this chat?')) {
                                      onDeleteSession?.(session.id);
                                      setSidebarOpen(false);
                                    }
                                  }}
                                  className="p-1 hover:bg-red-100 rounded"
                                  title="Delete chat"
                                >
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
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
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-white shadow-2xl border-r border-gray-200">
        <div className="flex h-16 items-center justify-center px-6 border-b border-gray-200 bg-white">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-sm transform group-hover:rotate-6 transition-all duration-300">
              <FaviconIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Merienda, cursive' }}>Nutri</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const isChatPage = item.href === '/chat';
            return (
              <div key={item.name}>
                <div className="group relative">
                  <Link
                    to={item.href}
                    className={clsx(
                      'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={clsx('w-5 h-5', isActive ? 'text-white' : 'text-gray-500')} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isChatPage && isActive && sessions && sessions.length > 0 && (
                      <span className="text-xs bg-white text-gray-900 px-2 py-0.5 rounded font-semibold">
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-white hover:bg-gray-100 text-gray-900 p-1.5 rounded-md"
                      title="New Chat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Show chat history under AI Chat */}
                {isChatPage && isActive && sessions && sessions.length > 0 && (
                  <div className="mt-1 ml-0 space-y-0.5 max-h-96 overflow-y-auto custom-scrollbar">
                    {sessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className={clsx(
                          'relative group rounded-lg text-sm transition-all duration-150',
                          activeSessionId === session.id
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {editingSessionId === session.id ? (
                          /* Edit mode */
                          <div className="flex items-center px-3 py-2 gap-2">
                            <MessageCircle className="w-3 h-3 flex-shrink-0" />
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, session.id)}
                              onBlur={() => saveTitle(session.id)}
                              className="flex-1 px-2 py-1 text-sm border border-green-500 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                              autoFocus
                            />
                            <button
                              onClick={() => saveTitle(session.id)}
                              className="p-1 hover:bg-green-200 rounded flex-shrink-0"
                              title="Save"
                            >
                              <Check className="w-3 h-3 text-green-600" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                              title="Cancel"
                            >
                              <XIcon className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        ) : (
                          /* View mode */
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                onSessionClick?.(session.id);
                              }}
                              className="w-full text-left px-3 py-2"
                            >
                              <div className="flex items-center gap-2.5">
                                <MessageCircle className={clsx('w-4 h-4 flex-shrink-0', activeSessionId === session.id ? 'text-gray-900' : 'text-gray-400')} />
                                <div className="flex-1 min-w-0">
                                  <div className="truncate text-sm font-medium">{session.title}</div>
                                </div>
                              </div>
                            </button>
                            {/* Action buttons - show on hover */}
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  startEditing(session);
                                }}
                                className="p-1.5 hover:bg-gray-200 rounded transition-colors duration-150"
                                title="Rename"
                              >
                                <Pencil className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (window.confirm('Delete this chat?')) {
                                    onDeleteSession?.(session.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-gray-200 rounded transition-colors duration-150"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {sessions.length > 10 && (
                      <div className="text-xs text-gray-500 px-3 py-2 text-center">
                        +{sessions.length - 10} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-3 bg-white">
          <Link
            to="/profile"
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg mb-1 transition-colors duration-150 group"
          >
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-500">View profile</div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
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
