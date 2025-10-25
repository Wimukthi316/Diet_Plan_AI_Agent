import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, MessageCircle, Plus, MoreHorizontal, Trash2, Edit3, ArrowLeft } from 'lucide-react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const response = await chatAPI.getSessions();
      const sessionsData = response.data.sessions || [];
      setSessions(sessionsData);

      // Load the active session or create a new one
      const active = sessionsData.find(s => s.is_active);
      if (active) {
        await loadSessionMessages(active.id);
      } else if (sessionsData.length > 0) {
        await loadSessionMessages(sessionsData[0].id);
      } else {
        // Create a new session if none exist
        await createNewSession();
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load chat sessions');
      showWelcomeMessage();
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    try {
      setIsLoadingHistory(true);
      const response = await chatAPI.getSessionMessages(sessionId);
      const messagesData = response.data.messages || [];

      // Convert to UI format
      const formattedMessages = messagesData.flatMap((item, index) => {
        const msgs = [];
        if (item.message && item.message.trim()) {
          msgs.push({
            id: `${item.id}-user-${index}`,
            type: 'user',
            content: item.message,
            timestamp: new Date(item.timestamp),
          });
        }
        if (item.response && item.response.trim()) {
          msgs.push({
            id: `${item.id}-ai-${index}`,
            type: 'ai',
            content: item.response,
            timestamp: new Date(item.timestamp),
            agent: item.agent,
          });
        }
        return msgs;
      });

      setMessages(formattedMessages);
      setActiveSession(response.data.session);

      // Activate this session
      await chatAPI.activateSession(sessionId);
    } catch (error) {
      console.error('Error loading session messages:', error);
      toast.error('Failed to load messages');
      showWelcomeMessage();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await chatAPI.createSession('New Chat');
      const newSession = response.data;
      setSessions([newSession, ...sessions]);
      setActiveSession(newSession);
      showWelcomeMessage();
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create new chat');
    }
  };

  const showWelcomeMessage = () => {
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: "**AI Nutrition Assistant**\\n*Powered by 3 specialized AI agents*\\n\\nHello! I'm your AI nutrition assistant. I can help you with:\\n\\n• Analyzing food nutrition\\n• Finding healthy recipes\\n• Tracking your diet progress\\n• Answering nutrition questions\\n\\nWhat would you like to know today?",
      timestamp: new Date(),
      agent: 'System'
    }]);
  };

  const handleSessionClick = async (sessionId) => {
    if (activeSession?.id === sessionId) return;
    await loadSessionMessages(sessionId);
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await chatAPI.deleteSession(sessionId);
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);

      // If deleted session was active, switch to another
      if (activeSession?.id === sessionId) {
        if (updatedSessions.length > 0) {
          await loadSessionMessages(updatedSessions[0].id);
        } else {
          await createNewSession();
        }
      }

      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await chatAPI.updateSessionTitle(sessionId, newTitle);
      const updatedSessions = sessions.map(s =>
        s.id === sessionId ? { ...s, title: newTitle } : s
      );
      setSessions(updatedSessions);

      // Update active session if it's the one being renamed
      if (activeSession?.id === sessionId) {
        setActiveSession({ ...activeSession, title: newTitle });
      }

      toast.success('Chat renamed');
    } catch (error) {
      console.error('Error renaming session:', error);
      toast.error('Failed to rename chat');
    }
  };

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
      await handleRenameSession(sessionId, editingTitle.trim());
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(
        userMessage.content,
        {},
        activeSession?.id
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: formatAIResponse(response.data),
        timestamp: new Date(),
        data: response.data
      };

      setMessages(prev => [...prev, aiMessage]);

      // Reload sessions to update message counts and titles
      await loadSessions();
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAIResponse = (responseData) => {
    if (responseData.error) {
      return `Sorry, I encountered an error: ${responseData.error}`;
    }

    let content = '';
    let agentName = 'AI Assistant';

    if (responseData.primary_agent) {
      const agentNames = {
        'nutrition_calculator': 'Nutrition Calculator',
        'recipe_finder': 'Recipe Finder',
        'diet_tracker': 'Diet Tracker'
      };
      agentName = agentNames[responseData.primary_agent] || 'AI Assistant';
    }

    content += `*Processed by: ${agentName}*\\n\\n`;

    if (responseData.primary_response) {
      if (responseData.primary_response.response) {
        content += responseData.primary_response.response;
      } else if (typeof responseData.primary_response === 'string') {
        content += responseData.primary_response;
      } else {
        content += JSON.stringify(responseData.primary_response, null, 2);
      }
    }

    if (responseData.synthesis) {
      content += '\\n\\n---\\n\\n';
      content += responseData.synthesis;
    }

    return content || 'I received your message but had trouble generating a response. Could you please rephrase your question?';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const suggestedPrompts = [
    "Analyze the nutrition in a banana",
    "Find me a healthy recipe for dinner",
    "Track my daily progress",
    "What are good protein sources?",
    "Create a meal plan for weight loss"
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Chat Sessions Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Merienda, cursive' }}>
              Chat History
            </h2>
            <button
              onClick={createNewSession}
              className="p-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all duration-200 shadow-md hover:shadow-lg"
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingSessions ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation to get started</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${activeSession?.id === session.id
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  onClick={() => handleSessionClick(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, session.id)}
                          onBlur={() => saveTitle(session.id)}
                          className="w-full px-2 py-1 text-sm font-medium bg-white border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                        />
                      ) : (
                        <h3 className={`text-sm font-medium truncate ${activeSession?.id === session.id ? 'text-green-800' : 'text-gray-900'
                          }`}>
                          {session.title}
                        </h3>
                      )}
                      <p className={`text-xs mt-1 ${activeSession?.id === session.id ? 'text-green-600' : 'text-gray-500'
                        }`}>
                        {session.message_count} messages
                      </p>
                    </div>

                    {/* Session Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(session);
                        }}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Rename"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Merienda, cursive' }}>
                {activeSession?.title || 'AI Nutrition Assistant'}
              </h1>
              <p className="text-sm text-gray-500">
                Powered by 3 specialized AI agents
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Loading chat history...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-4 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${message.type === 'user'
                    ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                    : message.error
                      ? 'bg-red-100 border-2 border-red-200'
                      : 'bg-white border-2 border-green-200'
                    }`}>
                    {message.type === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className={`w-5 h-5 ${message.error ? 'text-red-500' : 'text-green-600'}`} />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-3xl ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block px-6 py-4 rounded-2xl shadow-sm ${message.type === 'user'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white'
                        : message.error
                          ? 'bg-red-50 border border-red-200 text-red-800'
                          : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {message.content.split('**').map((part, index) =>
                          index % 2 === 1 ? (
                            <strong key={index} className="font-bold">
                              {part}
                            </strong>
                          ) : (
                            <span key={index}>{part}</span>
                          )
                        )}
                      </div>
                    </div>
                    <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white border-2 border-green-200 rounded-full flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Loader className="w-5 h-5 animate-spin text-green-600" />
                      <span className="text-gray-700 font-medium">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 1 && (
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(prompt)}
                    className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-full border border-green-200 hover:border-green-300 transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Ask me about nutrition, recipes, or diet tracking..."
                  rows={1}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-gray-50 resize-none transition-all duration-200"
                  style={{
                    minHeight: '50px',
                    maxHeight: '120px',
                    overflow: 'auto'
                  }}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
