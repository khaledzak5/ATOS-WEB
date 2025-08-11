import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import Icon from '../../components/AppIcon';
import { getUserById, updateUserProfile } from '../../utils/db';
import Button from '../../components/ui/Button';
import ProfileHeader from './components/ProfileHeader';
import PersonalInfoTab from './components/PersonalInfoTab';
import FitnessMetricsTab from './components/FitnessMetricsTab';
import AchievementsTab from './components/AchievementsTab';

const UserProfile = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('atos_user') || 'null');
    if (!user?.id) {
      navigate('/login-screen', { replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    // Use class instead of data attribute for Tailwind dark mode
    if (savedTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
    // Load session user from localStorage
    (async () => {
      try {
        const session = JSON.parse(localStorage.getItem('atos_user') || 'null');
        if (session?.id) {
          setUser({
            id: session?.id,
            name: session?.name || 'New User',
            email: session?.email || '',
            phone: '',
            dateOfBirth: '',
            location: '',
            profilePicture: session?.avatar || '',
            joinDate: new Date().toISOString().slice(0,10),
            totalWorkouts: 0,
            currentStreak: 0,
            longestStreak: 0,
            achievements: 0,
            thisWeekWorkouts: 0,
            thisMonthWorkouts: 0,
            age: '',
            height: '',
            weight: '',
            fitnessLevel: 'beginner',
            primaryGoal: '',
            totalCaloriesBurned: '0',
            totalWorkoutTime: '0h',
            goalsCompleted: 0
          });
        } else {
          setUser(null);
        }
      } catch {}
    })();
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Use class instead of data attribute for Tailwind dark mode
    if (newTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('atos_user');
    navigate('/login-screen', { replace: true });
  };

  const handleUpdateUser = async (updatedUser) => {
    setUser(updatedUser);
    try {
      const { updateUserProfile } = await import('../../utils/db');
      await updateUserProfile(updatedUser.id, updatedUser);
    } catch {}
  };

  const handleUpdateMetrics = (metrics) => {
    setUser(prev => ({ ...prev, ...metrics }));
  };

  const handleProfilePictureUpdate = async (newPicture) => {
    setUser(prev => ({ ...prev, profilePicture: newPicture }));
    try {
      if (user?.id) await updateUserProfile(user.id, { profilePicture: newPicture });
    } catch {}
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: 'User' },
    { id: 'metrics', label: 'Fitness Metrics', icon: 'Activity' },
    { id: 'achievements', label: 'Achievements', icon: 'Trophy' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoTab user={user} onUpdateUser={handleUpdateUser} />;
      case 'metrics':
        return <FitnessMetricsTab user={user} onUpdateMetrics={handleUpdateMetrics} />;
      case 'achievements':
        return <AchievementsTab user={user} />;
      default:
        return <PersonalInfoTab user={user} onUpdateUser={handleUpdateUser} />;
    }
  };

  const safeUser = user || {
    id: 0,
    name: 'New User',
    email: '',
    phone: '',
    dateOfBirth: '',
    location: '',
    profilePicture: '',
    joinDate: new Date().toISOString().slice(0,10),
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievements: 0,
    thisWeekWorkouts: 0,
    thisMonthWorkouts: 0,
    age: '',
    height: '',
    weight: '',
    fitnessLevel: 'beginner',
    primaryGoal: '',
    totalCaloriesBurned: '0',
    totalWorkoutTime: '0h',
    goalsCompleted: 0
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={handleThemeToggle}
        currentTheme={currentTheme}
         user={user || { name: 'New User', email: '' }}
        onLogout={handleLogout}
      />
      {/* Sidebar */}
      <SidebarNavigation
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {/* Main Content */}
      <main className="pt-16 lg:pl-72 min-h-screen">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </button>
            <Icon name="ChevronRight" size={16} />
            <span className="text-foreground font-medium">Profile</span>
          </nav>
          {/* Profile Header */}
          <ProfileHeader 
            user={safeUser} 
            onProfilePictureUpdate={handleProfilePictureUpdate}
          />

          {/* Tab Navigation */}
          <div className="bg-card border border-border rounded-lg mb-6">
            {/* Mobile Tab Selector */}
            <div className="lg:hidden border-b border-border">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e?.target?.value)}
                className="w-full p-4 bg-transparent text-card-foreground font-medium focus:outline-none"
              >
                {tabs?.map((tab) => (
                  <option key={tab?.id} value={tab?.id}>
                    {tab?.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Tab Navigation */}
            <div className="hidden lg:flex border-b border-border">
              {tabs?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === tab?.id
                      ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon name={tab?.icon} size={18} />
                  <span>{tab?.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {(() => {
                switch (activeTab) {
                  case 'personal':
                    return <PersonalInfoTab user={safeUser} onUpdateUser={handleUpdateUser} />;
                  case 'metrics':
                    return <FitnessMetricsTab user={safeUser} onUpdateMetrics={handleUpdateMetrics} />;
                  case 'achievements':
                    return <AchievementsTab user={safeUser} />;
                  default:
                    return <PersonalInfoTab user={safeUser} onUpdateUser={handleUpdateUser} />;
                }
              })()}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/exercise-workout-screen')}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Icon name="Play" size={18} />
                <span>Start Workout</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/ai-assistant-food-scanner')}
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Icon name="MessageCircle" size={18} />
                <span>AI Assistant</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Icon name="Download" size={18} />
                <span>Export Data</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-center space-x-2 h-12"
              >
                <Icon name="Share2" size={18} />
                <span>Share Progress</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;