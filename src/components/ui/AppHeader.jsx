import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const AppHeader = ({ 
  onSidebarToggle, 
  isSidebarOpen = false,
  onThemeToggle,
  currentTheme = 'light',
  user = null,
  onLogout
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Workout Reminder', message: 'Time for your evening workout!', time: '5 min ago', unread: true },
    { id: 2, title: 'Achievement Unlocked', message: 'You completed 7 days streak!', time: '1 hour ago', unread: true },
    { id: 3, title: 'Nutrition Tip', message: 'Try adding more protein to your diet', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications?.filter(n => n?.unread)?.length;

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    if (onLogout) onLogout();
  };

  const handleProfileNavigation = () => {
    navigate('/user-profile');
    setShowProfileMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-header">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section - Logo and Mobile Menu */}
        <div className="flex items-center space-x-4">
          {/* Mobile Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Icon name="Menu" size={20} />
          </Button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Zap" size={20} color="white" />
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:block">
              ATOS fit
            </span>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle moved to Profile Settings per spec */}

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationClick}
              aria-label="Notifications"
              className="relative"
            >
              <Icon name="Bell" size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-error-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-popover border border-border rounded-lg shadow-elevation-3 z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-popover-foreground">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications?.map((notification) => (
                    <div
                      key={notification?.id}
                      className={`p-4 border-b border-border last:border-b-0 hover:bg-muted transition-colors ${
                        notification?.unread ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-popover-foreground">
                            {notification?.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification?.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification?.time}
                          </p>
                        </div>
                        {notification?.unread && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={handleProfileClick}
              className="flex items-center space-x-2 px-2"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Icon name="User" size={16} color="white" />
              </div>
              <span className="hidden md:block text-sm font-medium text-foreground">
                {user?.name || 'User'}
              </span>
              <Icon name="ChevronDown" size={16} className="hidden md:block" />
            </Button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-56 bg-popover border border-border rounded-lg shadow-elevation-3 z-50">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-popover-foreground">
                    {user?.name || 'User Name'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                <div className="py-2">
                  <button
                    onClick={handleProfileNavigation}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors"
                  >
                    <Icon name="User" size={16} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={onThemeToggle}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors sm:hidden"
                  >
                    <Icon name={currentTheme === 'light' ? 'Moon' : 'Sun'} size={16} />
                    <span>Toggle Theme</span>
                  </button>
                  
                </div>
                <div className="py-2 border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  >
                    <Icon name="LogOut" size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Click outside to close dropdowns */}
      {(showProfileMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default AppHeader;