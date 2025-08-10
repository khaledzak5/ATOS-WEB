import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import AuthenticationLayout from '../../components/ui/AuthenticationLayout';
import RegistrationForm from './components/RegistrationForm';
import WelcomeAnimation from './components/WelcomeAnimation';

const RegisterScreen = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  const handleRegistrationSuccess = () => {
    setShowWelcome(true);
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    // Navigation is handled in RegistrationForm component
  };

  return (
    <>
      <Helmet>
        <title>Create Account - ATOS fit</title>
        <meta name="description" content="Join ATOS fit and start your personalized fitness journey with AI-powered coaching, exercise tracking, and nutrition guidance." />
        <meta name="keywords" content="fitness registration, AI fitness coach, workout tracker, health app signup" />
      </Helmet>

      <AuthenticationLayout
        title="Create Your Account"
        subtitle="Join thousands of users achieving their fitness goals with AI-powered coaching"
        showLogo={true}
      >
        <RegistrationForm onSuccess={handleRegistrationSuccess} />
      </AuthenticationLayout>

      <WelcomeAnimation 
        isVisible={showWelcome}
        onComplete={handleWelcomeComplete}
      />
    </>
  );
};

export default RegisterScreen;