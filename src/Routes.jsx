import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import AIAssistantFoodScanner from './pages/ai-assistant-food-scanner';
import LoginScreen from './pages/login-screen';
import Dashboard from './pages/dashboard';
import ExerciseWorkoutScreen from './pages/exercise-workout-screen';
import RegisterScreen from './pages/register-screen';
import UserProfile from './pages/user-profile';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<LoginScreen />} />
        <Route path="/ai-assistant-food-scanner" element={<AIAssistantFoodScanner />} />
        <Route path="/login-screen" element={<LoginScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exercise-workout-screen" element={<ExerciseWorkoutScreen />} />
        <Route path="/register-screen" element={<RegisterScreen />} />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
