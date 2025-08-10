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

  const handleSendMessage = async (message) => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      message,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        `Great question! Based on your fitness goals, I'd recommend focusing on compound movements that work multiple muscle groups. This will help you build strength efficiently while burning more calories.\n\nHere are some key exercises to include:\n• Squats (3 sets of 8-12 reps)\n• Push-ups (3 sets of 10-15 reps)\n• Lunges (3 sets of 10 per leg)\n• Planks (3 sets of 30-60 seconds)\n\nWould you like me to create a full workout routine for you?`,
        `Excellent! Nutrition plays a crucial role in achieving your fitness goals. Here's what I recommend:\n\n**Pre-workout (30-60 min before):**\n• Banana with almond butter\n• Greek yogurt with berries\n\n**Post-workout (within 30 min):**\n• Protein shake with whey protein\n• Chocolate milk\n• Grilled chicken with sweet potato\n\nRemember to stay hydrated throughout your workout!`,
        `Form is absolutely critical for both safety and effectiveness! Here are key points to remember:\n\n**For Squats:**\n• Keep your chest up and core engaged\n• Knees track over your toes\n• Go down until thighs are parallel to floor\n\n**For Push-ups:**\n• Maintain straight line from head to heels\n• Lower until chest nearly touches ground\n• Push through your palms, not fingertips\n\nWould you like me to analyze your form through video upload?`,
        `That's a smart approach! Progressive overload is key to continuous improvement. Here's how to implement it:\n\n**Week 1-2:** Master the movement pattern\n**Week 3-4:** Increase reps by 2-3 per set\n**Week 5-6:** Add weight or increase difficulty\n**Week 7-8:** Reduce rest time between sets\n\nTrack your progress and listen to your body. Consistency beats intensity every time!`
      ];

      const randomResponse = aiResponses?.[Math.floor(Math.random() * aiResponses?.length)];
      
      const aiMessage = {
        id: Date.now() + 1,
        message: randomResponse,
        isUser: false,
        timestamp: new Date()
      };

      setIsTyping(false);
      setMessages(prev => [...prev, aiMessage]);
    }, 2000);
  };

  const handleFoodCapture = async (file, scanType) => {
    setIsScanning(true);
    
    // Simulate food analysis
    setTimeout(() => {
      const mockResults = [
        {
          name: "Apple",
          calories: 95,
          protein: 0.5,
          carbohydrates: 25,
          sugar: 19,
          fat: 0.3,
          servingSize: "1 medium (182g)",
          confidence: 0.92,
          image: URL.createObjectURL(file),
          recommendation: "Apples are a great source of fiber and vitamin C. Perfect as a pre-workout snack for quick energy!",
          additionalInfo: {
            allergens: "None",
            healthScore: 4
          }
        },
        {
          name: "Grilled Salmon",
          calories: 206,
          protein: 22,
          carbohydrates: 0,
          sugar: 0,
          fat: 12,
          servingSize: "100g",
          confidence: 0.88,
          image: URL.createObjectURL(file),
          recommendation: "Excellent source of omega-3 fatty acids and high-quality protein. Perfect for muscle building and recovery!",
          additionalInfo: {
            allergens: "Fish",
            healthScore: 5
          }
        },
        {
          name: "Quinoa Bowl",
          calories: 222,
          protein: 8,
          carbohydrates: 39,
          sugar: 2,
          fat: 4,
          servingSize: "1 cup cooked (185g)",
          confidence: 0.85,
          image: URL.createObjectURL(file),
          recommendation: "Complete protein with all essential amino acids. Great post-workout meal for recovery and sustained energy!",
          additionalInfo: {
            allergens: "None",
            healthScore: 5
          }
        }
      ];

      const randomResult = mockResults?.[Math.floor(Math.random() * mockResults?.length)];
      randomResult.scanType = scanType;
      randomResult.timestamp = new Date();
      
      setScanResult(randomResult);
      setIsScanning(false);
    }, 3000);
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