import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import TabNavigation from './components/TabNavigation';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import FoodScannerCamera from './components/FoodScannerCamera';
import FoodAnalysisResult from './components/FoodAnalysisResult';
import ScanHistory from './components/ScanHistory';

const AIAssistantFoodScanner = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const chatContainerRef = useRef(null);

  // Mock chat messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      message: "Hello! I'm your AI fitness coach. I can help you with workout plans, nutrition advice, form corrections, and answer any fitness-related questions. How can I assist you today?",
      isUser: false,
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: 2,
      message: "Hi! I\'m looking to build muscle and lose fat at the same time. Is that possible?",
      isUser: true,
      timestamp: new Date(Date.now() - 240000)
    },
    {
      id: 3,
      message: `Absolutely! This is called body recomposition. Here's what I recommend:\n\n1. **Strength Training**: Focus on compound movements like squats, deadlifts, and bench press 3-4x per week\n2. **Protein Intake**: Aim for 1.6-2.2g per kg of body weight daily\n3. **Caloric Balance**: Eat at maintenance or slight deficit (200-300 calories)\n4. **Progressive Overload**: Gradually increase weights or reps\n5. **Recovery**: Get 7-9 hours of sleep and rest days\n\nWould you like me to create a specific workout plan for you?`,
      isUser: false,
      timestamp: new Date(Date.now() - 180000)
    }
  ]);

  // Mock scan history data
  useEffect(() => {
    const mockHistory = [
      {
        id: 1,
        name: "Grilled Chicken Breast",
        calories: 231,
        protein: 43.5,
        carbohydrates: 0,
        fat: 5.0,
        scanType: 'food',
        timestamp: new Date(Date.now() - 3600000),
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&h=200&fit=crop"
      },
      {
        id: 2,
        name: "Greek Yogurt with Berries",
        calories: 150,
        protein: 15,
        carbohydrates: 20,
        fat: 3.5,
        scanType: 'food',
        timestamp: new Date(Date.now() - 7200000),
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop"
      },
      {
        id: 3,
        name: "Protein Bar - Chocolate",
        calories: 200,
        protein: 20,
        carbohydrates: 15,
        fat: 8,
        scanType: 'qr',
        timestamp: new Date(Date.now() - 10800000),
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop"
      },
      {
        id: 4,
        name: "Banana",
        calories: 105,
        protein: 1.3,
        carbohydrates: 27,
        fat: 0.3,
        scanType: 'food',
        timestamp: new Date(Date.now() - 14400000),
        image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=200&fit=crop"
      },
      {
        id: 5,
        name: "Almonds (28g)",
        calories: 164,
        protein: 6,
        carbohydrates: 6,
        fat: 14,
        scanType: 'food',
        timestamp: new Date(Date.now() - 18000000),
        image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=300&h=200&fit=crop"
      }
    ];
    setScanHistory(mockHistory);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef?.current) {
      chatContainerRef.current.scrollTop = chatContainerRef?.current?.scrollHeight;
    }
  }, [messages, isTyping]);

  const CHATBOT_API_KEY = import.meta.env.VITE_CHATBOT_API_KEY;
  const handleSendMessage = async (message) => {
    const userMessage = {
      id: Date.now(),
      message,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': CHATBOT_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: message }
              ]
            }
          ]
        })
      });
      const data = await response.json();
      let aiText = 'Sorry, no response from AI.';
      if (Array.isArray(data?.candidates) && data.candidates.length > 0) {
        const parts = data.candidates[0]?.content?.parts;
        if (Array.isArray(parts) && parts.length > 0 && typeof parts[0].text === 'string') {
          aiText = parts[0].text.trim() || aiText;
        }
      }
      const aiMessage = {
        id: Date.now() + 1,
        message: aiText,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const aiMessage = {
        id: Date.now() + 1,
        message: 'Error contacting AI service.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFoodCapture = async (file, scanType) => {
    setIsScanning(true);
    try {
      // Convert image file to base64
      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const imageBase64 = await toBase64(file);

      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': CHATBOT_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: file.type,
                    data: imageBase64
                  }
                },
                {
                  text:
                    `Analyze this food image and predict its nutritional components. Always return a valid JSON object with these exact fields: { "name": string, "calories": number, "protein": number, "carbohydrates": number, "fat": number, "sugar": number, "serving_size": string, "recommendation": string, "allergens": string, "health_score": number }. Do not include any explanation or text outside the JSON. If you are unsure about the sugar content, estimate based on the food type.`
                }
              ]
            }
          ]
        })
      });
      const data = await response.json();
      let result = null;
      let rawText = '';
      if (Array.isArray(data?.candidates) && data.candidates.length > 0) {
        const parts = data.candidates[0]?.content?.parts;
        if (Array.isArray(parts) && parts.length > 0 && typeof parts[0].text === 'string') {
          rawText = parts[0].text;
          // Try to extract JSON from the response, even if embedded in a string
          let jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              result = JSON.parse(jsonMatch[0]);
            } catch {
              // fallback to top-level parse
              try {
                result = JSON.parse(rawText);
              } catch {
                result = null;
              }
            }
          } else {
            // fallback to top-level parse
            try {
              result = JSON.parse(rawText);
            } catch {
              result = null;
            }
          }
          // If still no result, fallback to showing raw text as recommendation
          if (!result) {
            result = {
              name: 'Unknown',
              recommendation: rawText || 'No prediction from AI.'
            };
          }
        }
      }
      if (result) {
        result.image = URL.createObjectURL(file);
        result.scanType = scanType;
        result.timestamp = new Date();
        setScanResult(result);
      } else {
        setScanResult({ name: 'Unknown', recommendation: rawText || 'No prediction from AI.', image: URL.createObjectURL(file), scanType, timestamp: new Date() });
      }
    } catch (error) {
      setScanResult({ name: 'Error', recommendation: 'Error contacting AI service.', image: URL.createObjectURL(file), scanType, timestamp: new Date() });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveToHistory = (result) => {
    const historyItem = {
      ...result,
      id: Date.now()
    };
    setScanHistory(prev => [historyItem, ...prev]);
    setScanResult(null);
  };

  const handleNewScan = () => {
    setScanResult(null);
  };

  const handleReanalyze = (scan) => {
    setScanResult(scan);
  };

  const handleClearHistory = () => {
    setScanHistory([]);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTheme = () => {
    setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    navigate('/login-screen');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        onSidebarToggle={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={toggleTheme}
        currentTheme={currentTheme}
        user={{ name: 'Alex Johnson', email: 'alex@example.com' }}
        onLogout={handleLogout}
      />
      {/* Sidebar */}
      <SidebarNavigation
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {/* Main Content */}
      <main className="pt-16 lg:pl-72 min-h-screen">
        <div className="p-4 lg:p-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
            <Icon name="ChevronRight" size={16} />
            <span className="text-foreground">AI Assistant & Food Scanner</span>
          </div>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              AI Assistant & Food Scanner
            </h1>
            <p className="text-muted-foreground">
              Get personalized fitness coaching and analyze your food nutrition with AI
            </p>
          </div>

          {/* Tab Navigation */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-6"
          />

          {/* Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="xl:col-span-2">
              {activeTab === 'chat' ? (
                /* Chat Assistant */
                (<div className="bg-card border border-border rounded-xl h-[600px] flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Icon name="Bot" size={20} color="white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground">ATOS fit</h3>
                        <p className="text-sm text-muted-foreground flex items-center space-x-1">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          <span>Online</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Chat Messages */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                  >
                    {messages?.map((message) => (
                      <ChatMessage
                        key={message?.id}
                        message={message?.message}
                        isUser={message?.isUser}
                        timestamp={message?.timestamp}
                      />
                    ))}
                    {isTyping && <ChatMessage message="" isUser={false} timestamp={new Date()} isTyping={true} />}
                  </div>
                  {/* Chat Input */}
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isTyping}
                  />
                </div>)
              ) : (
                /* Food Scanner */
                (<div className="bg-card border border-border rounded-xl p-6">
                  {scanResult ? (
                    <FoodAnalysisResult
                      result={scanResult}
                      onSaveToHistory={handleSaveToHistory}
                      onNewScan={handleNewScan}
                    />
                  ) : (
                    <FoodScannerCamera
                      onCapture={handleFoodCapture}
                      onUpload={handleFoodCapture}
                      isScanning={isScanning}
                    />
                  )}
                </div>)
              )}
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              {activeTab === 'chat' ? (
                /* Chat Sidebar - Quick Actions */
                (<div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-card-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Dumbbell"
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => navigate('/exercise-workout-screen')}
                    >
                      Start Workout
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Camera"
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('scanner')}
                    >
                      Scan Food
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="User"
                      iconPosition="left"
                      className="w-full justify-start"
                      onClick={() => navigate('/user-profile')}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>)
              ) : (
                /* Scanner Sidebar - Scan History */
                (<div className="bg-card border border-border rounded-xl p-4">
                  <ScanHistory
                    history={scanHistory}
                    onReanalyze={handleReanalyze}
                    onClearHistory={handleClearHistory}
                  />
                </div>)
              )}

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-primary/10 to-success/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon name="Lightbulb" size={20} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Pro Tip</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'chat' 
                    ? "Ask specific questions about your workouts, nutrition, or form for more personalized advice!"
                    : "For best results, scan food in good lighting and ensure the item fills most of the camera frame."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistantFoodScanner;