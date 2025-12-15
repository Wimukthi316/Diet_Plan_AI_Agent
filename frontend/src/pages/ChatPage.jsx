import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const newSession = await createNewSession();
        if (newSession) {
          setSessions([newSession]);
        }
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

      // Show welcome message if session has no messages
      if (formattedMessages.length === 0) {
        showWelcomeMessage();
      } else {
        setMessages(formattedMessages);
      }
      
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
      // Don't update sessions here - let the caller handle it
      setActiveSession(newSession);
      showWelcomeMessage();
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create new chat');
      return null;
    }
  };

  const showWelcomeMessage = () => {
    setMessages([{
      id: 'welcome',
      type: 'ai',
      content: "### **🤖 AI Nutrition Assistant**\n*Powered by 3 specialized AI agents*\n\nHello! I'm your AI nutrition assistant. I can help you with:\n\n• Analyzing food nutrition\n• Finding healthy recipes\n• Tracking your diet progress\n• Answering nutrition questions\n\nWhat would you like to know today?",
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
      
      // If deleted session was active, switch to another
      if (activeSession?.id === sessionId) {
        if (updatedSessions.length > 0) {
          setSessions(updatedSessions);
          await loadSessionMessages(updatedSessions[0].id);
        } else {
          // Create new session when no sessions left
          const newSession = await createNewSession();
          if (newSession) {
            setSessions([newSession]);
            setActiveSession(newSession);
          }
        }
      } else {
        // Just update the sessions list if deleted session wasn't active
        setSessions(updatedSessions);
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

      // Reload sessions to update message counts and titles (without creating new session)
      const sessionsResponse = await chatAPI.getSessions();
      const sessionsData = sessionsResponse.data.sessions || [];
      setSessions(sessionsData);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Determine appropriate error message
      let errorContent = "I apologize, but I encountered an error while processing your request. Please try again.";
      
      if (error.userMessage) {
        errorContent = error.userMessage;
      } else if (!error.response) {
        errorContent = "Unable to connect to the server. Please ensure the backend is running (http://localhost:8000) and try again.";
      } else if (error.response?.data?.error) {
        errorContent = `I apologize, but ${error.response.data.error}`;
      } else if (error.response?.data?.detail) {
        errorContent = `Error: ${error.response.data.detail}`;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorContent,
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error(error.userMessage || 'Failed to send message');
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

  const formatMessageContent = (content) => {
    if (!content) return '';
    
    let html = content;
    
    // Convert ### headings to styled h3 with emoji support
    html = html.replace(/###\s+\*\*(.+?)\*\*/g, '<h3 class="text-2xl font-bold text-green-800 mb-4 mt-6 pb-2 border-b-2 border-green-200 flex items-center gap-2">$1</h3>');
    html = html.replace(/###\s+(.+?)$/gm, '<h3 class="text-2xl font-bold text-green-800 mb-4 mt-6 pb-2 border-b-2 border-green-200">$1</h3>');
    
    // Convert ## headings to styled h2
    html = html.replace(/##\s+\*\*(.+?)\*\*/g, '<h2 class="text-3xl font-bold text-green-900 mb-5 mt-7 pb-3 border-b-4 border-green-300">$1</h2>');
    html = html.replace(/##\s+(.+?)$/gm, '<h2 class="text-3xl font-bold text-green-900 mb-5 mt-7 pb-3 border-b-4 border-green-300">$1</h2>');
    
    // Convert # headings to styled h1
    html = html.replace(/#\s+\*\*(.+?)\*\*/g, '<h1 class="text-4xl font-bold text-green-900 mb-6 mt-8 pb-3 border-b-4 border-green-400">$1</h1>');
    html = html.replace(/#\s+(.+?)$/gm, '<h1 class="text-4xl font-bold text-green-900 mb-6 mt-8 pb-3 border-b-4 border-green-400">$1</h1>');
    
    // Convert **text** to bold with green accent
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-green-900 bg-green-50 px-1 rounded">$1</strong>');
    
    // Convert *text* to italic
    html = html.replace(/\*([^\*]+?)\*/g, '<em class="italic text-gray-700">$1</em>');
    
    // Convert bullet points • to styled list items with better spacing
    html = html.replace(/^[•\*]\s+(.+?)$/gm, '<li class="ml-6 mb-3 pl-2 flex items-start leading-relaxed"><span class="text-green-600 mr-3 mt-1 text-lg">●</span><span class="flex-1">$1</span></li>');
    
    // Wrap consecutive list items in ul with better styling
    html = html.replace(/(<li class="ml-6[^>]*>[\s\S]+?<\/li>)(?!\s*<li)/g, '<ul class="space-y-2 my-5 bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">$1</ul>');
    
    // Convert horizontal rules
    html = html.replace(/^---$/gm, '<hr class="my-6 border-t-2 border-gray-300" />');
    
    // Convert line breaks to <br> with proper spacing
    html = html.replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-base">');
    html = html.replace(/\n/g, '<br />');
    
    // Wrap in paragraph with better spacing
    html = `<div class="formatted-content space-y-2"><p class="mb-4 leading-relaxed text-base">${html}</p></div>`;
    
    // Clean up empty paragraphs
    html = html.replace(/<p class="mb-4 leading-relaxed text-base"><\/p>/g, '');
    html = html.replace(/<p class="mb-4 leading-relaxed text-base"><br \/><\/p>/g, '');
    
    return html;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const suggestedPrompts = [
    "Calculate my daily caloric needs",
    "Suggest high-protein meal options",
    "Analyze macro breakdown for chicken breast",
    "Design a 7-day meal plan for muscle gain",
    "What are the best foods for heart health?"
  ];

  return (
    <Layout 
      sessions={sessions} 
      activeSessionId={activeSession?.id}
      onSessionClick={handleSessionClick}
      onNewSession={createNewSession}
      onDeleteSession={handleDeleteSession}
      onRenameSession={handleRenameSession}
    >
      <div className="h-full">
        {/* Main Chat Area */}
        <div className="h-full flex flex-col bg-white">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Welcome Message - Special Styling */}
                {message.id === 'welcome' ? (
                  <div className="w-full flex flex-col items-center justify-center py-12 px-6">
                    {/* Animated Bot Icon */}
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
                      <div className="relative w-24 h-24 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                        <Bot className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    {/* Welcome Title */}
                    <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-green-700 via-green-600 to-green-800 bg-clip-text text-transparent" style={{ fontFamily: 'Merienda, cursive' }}>
                      AI Nutrition Assistant
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="text-lg text-gray-600 mb-8 italic" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Powered by 3 specialized AI agents
                    </p>

                    {/* Greeting */}
                    <p className="text-xl text-gray-700 mb-12 text-center max-w-2xl" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      Hello! I&apos;m your AI nutrition assistant. I can help you with:
                    </p>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-2 gap-6 w-full max-w-3xl mb-12">
                      <div className="group bg-white hover:bg-green-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-2xl">🥗</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                              Analyze Nutrition
                            </h3>
                            <p className="text-sm text-gray-600">Get detailed nutritional information for any food</p>
                          </div>
                        </div>
                      </div>

                      <div className="group bg-white hover:bg-green-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-2xl">🍳</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                              Find Recipes
                            </h3>
                            <p className="text-sm text-gray-600">Discover healthy recipes tailored to you</p>
                          </div>
                        </div>
                      </div>

                      <div className="group bg-white hover:bg-green-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-2xl">📊</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                              Track Progress
                            </h3>
                            <p className="text-sm text-gray-600">Monitor your daily diet and achievements</p>
                          </div>
                        </div>
                      </div>

                      <div className="group bg-white hover:bg-green-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-2xl">💡</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                              Get Answers
                            </h3>
                            <p className="text-sm text-gray-600">Ask any nutrition-related questions</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Call to Action */}
                    <p className="text-lg text-gray-700 font-medium" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                      What would you like to know today? 🌟
                    </p>
                  </div>
                ) : (
                  /* Regular Message Styling */
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
                        className="leading-relaxed text-sm space-y-3"
                        style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                        dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                      />
                      <div
                        className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-green-100' : 'text-gray-400'
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                )}
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
        <div className="border-t border-gray-200 p-6 bg-white">
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
    </Layout>
  );
};

export default ChatPage;
