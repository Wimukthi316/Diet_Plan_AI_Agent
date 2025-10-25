import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, MessageCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
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

    <div className="max-w-6xl mx-auto">
      {/* Modern Chat Container */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden h-[calc(100vh-50px)] flex flex-col">
        {/* Modern Chat Header */}
        <div className="bg-green-800 px-8 py-6">
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

        {/* Modern Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Loading history indicator */}
          {isLoadingHistory && (
            <div className="flex justify-center items-center h-32">
              <div className="flex items-center space-x-3 text-gray-500">
                <Loader className="w-6 h-6 animate-spin text-green-600" />
                <span className="text-lg font-medium" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  Loading chat history...
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-6">
            {!isLoadingHistory && messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${message.type === 'user'
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
                    className={`px-5 py-3 rounded-2xl shadow-md ${message.type === 'user'
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
                      className={`text-xs mt-2 ${message.type === 'user' ? 'text-green-100' : 'text-gray-400'
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

        {/* Modern Suggested Prompts */}
        {messages.length === 1 && (
          <div className="border-t border-gray-200 px-6 py-6 bg-white">
            <p className="text-lg font-semibold text-gray-700 mb-4" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Try asking:
            </p>
            <div className="flex flex-wrap gap-3">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(prompt)}
                  className="px-4 py-2 bg-green-100 hover:bg-green-200 rounded-xl text-green-800 font-medium transition-all duration-200 border border-green-200 hover:border-green-300"
                  style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modern Input Section */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about nutrition, recipes, or diet tracking..."
              className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 bg-gray-50 font-medium text-lg transition-all duration-200"
              disabled={isLoading}
              style={{ fontFamily: 'TASA Explorer, sans-serif' }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-green-800 hover:bg-green-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center gap-2"
              style={{ fontFamily: 'TASA Explorer, sans-serif' }}
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>

  );
};

export default ChatPage;
