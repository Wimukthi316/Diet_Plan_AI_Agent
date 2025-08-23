import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI nutrition assistant. I can help you with:\n\n• Analyzing food nutrition\n• Finding healthy recipes\n• Tracking your diet progress\n• Answering nutrition questions\n\nWhat would you like to know today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <div className="h-[calc(100vh-200px)] flex flex-col bg-white rounded-lg shadow-sm border">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">AI Nutrition Assistant</h2>
            <p className="text-sm text-gray-500">
              Powered by 3 specialized AI agents
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-primary-600 ml-3' 
                  : 'bg-gray-100 mr-3'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className={`w-4 h-4 ${message.error ? 'text-red-500' : 'text-gray-600'}`} />
                )}
              </div>

              {/* Message Content */}
              <div className={`px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : message.error
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="whitespace-pre-wrap">
                  {message.content.split('**').map((part, index) => 
                    index % 2 === 1 ? (
                      <strong key={index}>{part}</strong>
                    ) : (
                      <span key={index}>{part}</span>
                    )
                  )}
                </div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-3 max-w-3xl">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div className="border-t border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(prompt)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about nutrition, recipes, or diet tracking..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="btn-primary px-4 py-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
