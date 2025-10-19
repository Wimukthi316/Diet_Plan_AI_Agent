import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Trash2, MessageCircle, Plus, Edit2, Check, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef(null);

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

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;

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

  const startEditingTitle = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveSessionTitle = async (sessionId) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      await chatAPI.updateSessionTitle(sessionId, editingTitle);
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, title: editingTitle } : s
      ));
      if (activeSession?.id === sessionId) {
        setActiveSession({ ...activeSession, title: editingTitle });
      }
      setEditingSessionId(null);
      toast.success('Title updated');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    }
  };

  const cancelEditingTitle = () => {
    setEditingSessionId(null);
    setEditingTitle('');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const suggestedPrompts = [
    "Analyze the nutrition in a banana",
    "Find me a healthy recipe for dinner",
    "Track my daily progress",
    "What are good protein sources?",
    "Create a meal plan for weight loss"
  ];

  return (
    <div className="relative h-[calc(100vh-120px)]">
      {/* Collapsible Sessions Sidebar */}
      <div 
        className={`fixed top-[80px] left-[288px] bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-20 ${
          showSessions ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'
        } h-[calc(100vh-80px)] overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Sessions Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-800 hover:bg-green-900 text-white rounded-xl transition-all duration-200 font-semibold shadow-md"
              style={{ fontFamily: 'TASA Explorer, sans-serif' }}
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-3">
            {isLoadingSessions ? (
              <div className="flex justify-center items-center h-32">
                <Loader className="w-6 h-6 animate-spin text-green-600" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-gray-400 py-8 px-4">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No chats yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={`group relative p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    activeSession?.id === session.id
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  {editingSessionId === session.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveSessionTitle(session.id);
                          if (e.key === 'Escape') cancelEditingTitle();
                        }}
                        className="flex-1 bg-white border border-gray-300 text-gray-800 px-2 py-1 rounded text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveSessionTitle(session.id);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditingTitle();
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
                            <h3
                              className="text-sm font-medium truncate text-gray-800"
                              style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                            >
                              {session.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{session.message_count} messages</span>
                            <span>•</span>
                            <span>{formatDate(session.updated_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => startEditingTitle(session, e)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Edit title"
                          >
                            <Edit2 className="w-3 h-3 text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1 hover:bg-red-100 rounded"
                            title="Delete chat"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sessions Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              <p className="font-semibold" style={{ fontFamily: 'Merienda, cursive' }}>
                Chat History
              </p>
              <p className="mt-1">{sessions.length} conversation{sessions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Sessions Button */}
      <button
        onClick={() => setShowSessions(!showSessions)}
        className={`fixed top-[100px] ${showSessions ? 'left-[656px]' : 'left-[288px]'} z-30 bg-green-800 hover:bg-green-900 text-white p-2 rounded-r-lg shadow-lg transition-all duration-300`}
        title={showSessions ? 'Hide chat history' : 'Show chat history'}
      >
        {showSessions ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Main Chat Area */}
      <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 px-8 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                <Bot className="w-7 h-7 text-green-800" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Merienda, cursive' }}>
                  {activeSession?.title || 'New Chat'}
                </h2>
                {activeSession && (
                  <p className="text-sm text-green-100">
                    {activeSession.message_count} messages
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                    message.type === 'user'
                      ? 'bg-green-800'
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

                  <div
                    className={`px-5 py-3 rounded-2xl shadow-md ${
                      message.type === 'user'
                        ? 'bg-green-800 text-white'
                        : message.error
                        ? 'bg-red-50 border-2 border-red-200 text-red-800'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div
                      className="whitespace-pre-wrap leading-relaxed text-sm"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    >
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
                    <div
                      className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-green-100' : 'text-gray-400'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white border-2 border-green-200 rounded-xl flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl shadow-md">
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin text-green-600" />
                      <span className="text-sm text-gray-700 font-medium">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 1 && !isLoading && (
          <div className="border-t border-gray-200 px-6 py-4 bg-white">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm font-semibold text-gray-600 mb-3" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(prompt)}
                    className="px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-lg text-green-800 font-medium transition-all duration-200 border border-green-200"
                    style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6 bg-white rounded-b-2xl">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about nutrition, recipes, or diet tracking..."
                className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-gray-50 font-medium transition-all duration-200 text-sm"
                disabled={isLoading}
                style={{ fontFamily: 'TASA Explorer, sans-serif' }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-green-800 hover:bg-green-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all duration-200 flex items-center gap-2 text-sm"
                style={{ fontFamily: 'TASA Explorer, sans-serif' }}
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
