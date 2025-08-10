import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticationLayout from '../../components/ui/AuthenticationLayout';
import LoginForm from './components/LoginForm';
import SocialLogin from './components/SocialLogin';
import SecurityBadges from './components/SecurityBadges';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (formData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      localStorage.setItem('atos_user', JSON.stringify({
        id: 1,
        name: 'Alex Johnson',
        email: formData?.email,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        loginTime: new Date()?.toISOString()
      }));

      // Smooth transition to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    
    try {
      // Simulate social login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful social login
      localStorage.setItem('atos_user', JSON.stringify({
        id: 1,
        name: 'Alex Johnson',
        email: `user@${provider?.toLowerCase()}.com`,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        provider: provider,
        loginTime: new Date()?.toISOString()
      }));

      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Social login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <AuthenticationLayout
        title="Welcome Back"
        subtitle="Sign in to continue your fitness journey"
        showLogo={true}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-card/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">Signing you in...</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <LoginForm 
          onSubmit={handleLogin}
          isLoading={isLoading}
        />

        {/* Social Login */}
        <SocialLogin 
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
        />

        {/* Security Badges */}
        <div className="pt-6">
          <SecurityBadges />
        </div>

        {/* Footer Text */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Secure login powered by industry-standard encryption
          </p>
        </div>
      </AuthenticationLayout>
    </div>
  );
};

export default LoginScreen;