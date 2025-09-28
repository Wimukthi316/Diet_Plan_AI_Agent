import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Trash2, MessageCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await chatAPI.getChatHistory();

      console.log('Chat history response:', response.data); // Debug log

      if (response.data && response.data.history && response.data.history.length > 0) {
        // Convert history to message format
        const historyMessages = response.data.history.reverse().map((item, index) => {
          // Ensure we have valid data
          if (!item.message && !item.response) {
            console.warn('Invalid chat history item:', item);
            return [];
          }

          const messages = [];

          // Create user message if it exists
          if (item.message && item.message.trim()) {
            messages.push({
              id: `${item.id}-user-${index}`,
              type: 'user',
              content: item.message,
              timestamp: new Date(item.timestamp),
              agent: item.agent
            });
          }

          // Create AI response message if it exists
          if (item.response && item.response.trim()) {
            messages.push({
              id: `${item.id}-ai-${index}`,
              type: 'ai',
              content: item.response,
              timestamp: new Date(item.timestamp),
              agent: item.agent
            });
          }

          return messages;
        }).flat().filter(msg => msg); // Remove any undefined/null messages

        setMessages(historyMessages);
        console.log('Loaded messages:', historyMessages); // Debug log
      } else {
        // Show welcome message if no history
        setMessages([{
          id: 'welcome',
          type: 'ai',
          content: "**AI Nutrition Assistant**\n*Powered by 3 specialized AI agents*\n\nHello! I'm your AI nutrition assistant. I can help you with:\n\n• Analyzing food nutrition\n• Finding healthy recipes\n• Tracking your diet progress\n• Answering nutrition questions\n\nWhat would you like to know today?",
          timestamp: new Date(),
          agent: 'System'
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Show welcome message on error
      setMessages([{
        id: 'welcome',
        type: 'ai',
        content: "**AI Nutrition Assistant**\n*Powered by 3 specialized AI agents*\n\nHello! I'm your AI nutrition assistant. I can help you with:\n\n• Analyzing food nutrition\n• Finding healthy recipes\n• Tracking your diet progress\n• Answering nutrition questions\n\nWhat would you like to know today?",
        timestamp: new Date(),
        agent: 'System'
      }]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      await chatAPI.clearChatHistory();
      setMessages([{
        id: 'welcome',
        type: 'ai',
        content: "**AI Nutrition Assistant**\n*Powered by 3 specialized AI agents*\n\nHello! I'm your AI nutrition assistant. I can help you with:\n\n• Analyzing food nutrition\n• Finding healthy recipes\n• Tracking your diet progress\n• Answering nutrition questions\n\nWhat would you like to know today?",
        timestamp: new Date(),
        agent: 'System'
      }]);
      toast.success('Chat history cleared!');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast.error('Failed to clear chat history');
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
      const response = await chatAPI.sendMessage(userMessage.content);

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: formatAIResponse(response.data),
        timestamp: new Date(),
        data: response.data
      };

      setMessages(prev => [...prev, aiMessage]);
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
    // Format the multi-agent response for display
    if (responseData.error) {
      return `Sorry, I encountered an error: ${responseData.error}`;
    }

    let content = '';
    let agentName = 'AI Assistant';

    // Get the primary agent name
    if (responseData.primary_agent) {
      const agentNames = {
        'nutrition_calculator': 'Nutrition Calculator',
        'recipe_finder': 'Recipe Finder',
        'diet_tracker': 'Diet Tracker'
      };
      agentName = agentNames[responseData.primary_agent] || 'AI Assistant';
    }

    // Add agent identifier
    content += `*Processed by: ${agentName}*\n\n`;

    // Primary response
    if (responseData.primary_response) {
      if (responseData.primary_response.response) {
        content += responseData.primary_response.response;
      } else if (responseData.primary_response.food_analysis) {
        const analysis = responseData.primary_response.food_analysis;
        content += `**Nutrition Analysis for ${analysis.food_name}**\n\n`;
        content += `🔥 **Calories:** ${analysis.calories} kcal\n`;
        content += `🥩 **Protein:** ${analysis.protein}g\n`;
        content += `🍞 **Carbs:** ${analysis.carbs}g\n`;
        content += `🧈 **Fat:** ${analysis.fat}g\n`;
        if (analysis.fiber) content += `🌾 **Fiber:** ${analysis.fiber}g\n`;
        if (analysis.sugar) content += `🍯 **Sugar:** ${analysis.sugar}g\n`;
        if (analysis.sodium) content += `🧂 **Sodium:** ${analysis.sodium}mg\n`;
      } else if (responseData.primary_response.recipes) {
        content += `**Recipe Suggestions:**\n\n`;
        responseData.primary_response.recipes.slice(0, 3).forEach((recipe, index) => {
          content += `${index + 1}. **${recipe.name}**\n`;
          if (recipe.description) content += `   ${recipe.description}\n`;
          if (recipe.calories) content += `   Calories: ${recipe.calories}\n`;
          content += '\n';
        });
      } else if (responseData.primary_response.daily_analysis) {
        const analysis = responseData.primary_response.daily_analysis;
        content += `**Daily Analysis:**\n\n`;
        content += `• Total Calories: ${analysis.totals.calories}\n`;
        content += `• Protein: ${analysis.totals.protein}g\n`;
        content += `• Carbs: ${analysis.totals.carbs}g\n`;
        content += `• Fat: ${analysis.totals.fat}g\n\n`;
        if (analysis.insights) {
          content += `**Insights:** ${analysis.insights}`;
        }
      } else {
        // Fallback: try to extract any text response from the primary_response
        const response = responseData.primary_response;
        if (typeof response === 'string') {
          content += response;
        } else if (response && typeof response === 'object') {
          // Try different possible response fields
          content += response.response || response.text || response.content ||
            JSON.stringify(response, null, 2);
        }
      }
    }

    // Add collaboration insights if available
    if (responseData.synthesis) {
      content += '\n\n---\n\n';
      content += responseData.synthesis;
    }

    // Add agent info
    if (responseData.primary_agent) {
      content += `\n\n*Processed by: ${responseData.primary_agent.replace('_', ' ')}*`;
      if (responseData.collaborations && Object.keys(responseData.collaborations).length > 0) {
        content += ` (with collaboration from ${Object.keys(responseData.collaborations).join(', ')})`;
      }
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Modern Chat Container - Full Screen */}
      <div className="bg-white flex-1 flex flex-col overflow-hidden h-full">
        {/* Modern Chat Header */}
        <div className="bg-green-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 text-green-800" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Merienda, cursive' }}>
                  Nutri AI Assistant
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                  Powered by 3 specialized AI agents
                </p>
              </div>
            </div>
            {/* Clear Chat Button */}
            <button
              onClick={clearChatHistory}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold shadow-lg"
              title="Clear chat history"
              style={{ fontFamily: 'TASA Explorer, sans-serif' }}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Modern Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-0">
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
                <div className={`flex max-w-4xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
                  {/* Modern Avatar */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${message.type === 'user'
                    ? 'bg-green-800'
                    : message.error
                      ? 'bg-red-100 border-2 border-red-200'
                      : 'bg-white border-2 border-green-200'
                    }`}>
                    {message.type === 'user' ? (
                      <User className="w-6 h-6 text-white" />
                    ) : (
                      <Bot className={`w-6 h-6 ${message.error ? 'text-red-500' : 'text-green-600'}`} />
                    )}
                  </div>

                  {/* Modern Message Content */}
                  <div
                    className={`px-6 py-4 rounded-2xl max-w-2xl shadow-lg ${message.type === 'user'
                      ? 'bg-green-800 text-white'
                      : message.error
                        ? 'bg-red-50 border-2 border-red-200 text-red-800'
                        : 'bg-white border-2 border-gray-200 text-gray-800'
                      }`}
                  >
                    <div
                      className="whitespace-pre-wrap leading-relaxed"
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    >
                      {message.content.split('**').map((part, index) =>
                        index % 2 === 1 ? (
                          <strong
                            key={index}
                            className={`${message.type === 'user' ? 'text-white' : 'text-gray-900'} font-bold`}
                          >
                            {part}
                          </strong>
                        ) : (
                          <span key={index}>
                            {part}
                          </span>
                        )
                      )}
                    </div>
                    <div
                      className={`text-sm mt-3 ${message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}
                      style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Modern Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-4 max-w-4xl">
                  <div className="w-12 h-12 bg-white border-2 border-green-200 rounded-2xl flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="bg-white border-2 border-gray-200 px-6 py-4 rounded-2xl shadow-lg">
                    <div className="flex items-center space-x-3">
                      <Loader className="w-5 h-5 animate-spin text-green-600" />
                      <span className="text-gray-700 font-medium" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Minimized Suggested Prompts */}
        {messages.length === 1 && (
          <div className="border-t border-gray-200 px-4 py-3 bg-white">
            <p className="text-sm font-medium text-gray-600 mb-2" style={{ fontFamily: 'TASA Explorer, sans-serif' }}>
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(prompt)}
                  className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded-lg text-green-800 text-sm font-medium transition-all duration-200 border border-green-200 hover:border-green-300"
                  style={{ fontFamily: 'TASA Explorer, sans-serif' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}        {/* Modern Input Section */}
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
              className="bg-green-800 hover:bg-green-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center gap-2"
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
