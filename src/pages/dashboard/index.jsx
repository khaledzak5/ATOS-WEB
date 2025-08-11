import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import WelcomeSection from './components/WelcomeSection';
import TodayWorkoutCard from './components/TodayWorkoutCard';
import ExerciseCard from './components/ExerciseCard';
import DailyTipsCard from './components/DailyTipsCard';
import ProgressWidget from './components/ProgressWidget';
import QuickActionsCard from './components/QuickActionsCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  // Check authentication on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('atos_user') || 'null');
    if (!user?.id) {
      navigate('/login-screen', { replace: true });
      return;
    }
  }, [navigate]);

  // Mock user data
  const [user, setUser] = useState({ name: 'New User', email: '', profilePicture: '', fitnessLevel: 'Beginner', goals: [] });
  useEffect(() => {
    (async () => {
      try {
        const session = JSON.parse(localStorage.getItem('atos_user') || 'null');
        if (session?.id) {
          setUser({
            name: session?.name || 'New User',
            email: session?.email || '',
            profilePicture: session?.avatar || '',
            fitnessLevel: 'Beginner',
            goals: []
          });
        }
      } catch {}
    })();
  }, []);

  // Mock exercise data
  const exercises = [
    {
      id: 1,
      name: "Push-ups",
      targetMuscles: "Chest, Arms, Core",
      difficulty: "Beginner",
      duration: 8,
      caloriesBurn: 45,
      sets: 3,
      reps: 15,
      description: "Classic upper body exercise targeting chest, shoulders, and triceps with core engagement."
    },
    {
      id: 2,
      name: "Squats",
      targetMuscles: "Legs, Glutes, Core",
      difficulty: "Beginner",
      duration: 10,
      caloriesBurn: 60,
      sets: 3,
      reps: 20,
      description: "Fundamental lower body movement strengthening quadriceps, glutes, and core muscles."
    },
    {
      id: 3,
      name: "Lunges",
      targetMuscles: "Legs, Glutes, Balance",
      difficulty: "Intermediate",
      duration: 12,
      caloriesBurn: 70,
      sets: 3,
      reps: 12,
      description: "Unilateral leg exercise improving balance, strength, and coordination."
    },
    {
      id: 4,
      name: "Burpees",
      targetMuscles: "Full Body, Cardio",
      difficulty: "Advanced",
      duration: 15,
      caloriesBurn: 120,
      sets: 3,
      reps: 10,
      description: "High-intensity full-body exercise combining strength and cardiovascular training."
    },
    {
      id: 5,
      name: "Mountain Climbers",
      targetMuscles: "Core, Cardio, Arms",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 80,
      sets: 3,
      reps: 20,
      description: "Dynamic core exercise with cardiovascular benefits and upper body engagement."
    },
    {
      id: 6,
      name: "Jumping Jacks",
      targetMuscles: "Full Body, Cardio",
      difficulty: "Beginner",
      duration: 6,
      caloriesBurn: 50,
      sets: 3,
      reps: 30,
      description: "Classic cardio exercise improving coordination and cardiovascular endurance."
    },
    {
      id: 7,
      name: "High Knees",
      targetMuscles: "Legs, Core, Cardio",
      difficulty: "Beginner",
      duration: 5,
      caloriesBurn: 40,
      sets: 3,
      reps: 25,
      description: "Running-in-place variation focusing on leg strength and cardiovascular fitness."
    },
    {
      id: 8,
      name: "Plank",
      targetMuscles: "Core, Shoulders, Back",
      difficulty: "Intermediate",
      duration: 10,
      caloriesBurn: 35,
      sets: 3,
      reps: "30s",
      description: "Isometric core exercise building strength and stability throughout the torso."
    },
    {
      id: 9,
      name: "Side Plank",
      targetMuscles: "Core, Obliques, Shoulders",
      difficulty: "Intermediate",
      duration: 8,
      caloriesBurn: 30,
      sets: 3,
      reps: "20s",
      description: "Lateral core strengthening exercise targeting obliques and lateral stability."
    },
    {
      id: 10,
      name: "Wall Sit",
      targetMuscles: "Legs, Glutes, Core",
      difficulty: "Beginner",
      duration: 7,
      caloriesBurn: 25,
      sets: 3,
      reps: "30s",
      description: "Isometric leg exercise building endurance in quadriceps and glutes."
    }
  ];

  // Sort exercises by difficulty Beginner -> Intermediate -> Advanced
  const difficultyOrder = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
  const sortedExercises = [...exercises].sort((a, b) => (difficultyOrder[a.difficulty] ?? 3) - (difficultyOrder[b.difficulty] ?? 3));

  // Mock progress data
  const [progressData, setProgressData] = useState({
    weeklyGoal: 5,
    completedWorkouts: 0,
    currentStreak: 0,
    totalWorkouts: 0,
    caloriesBurned: 0,
    weeklyCalorieGoal: 2000,
    achievements: []
  });
  useEffect(() => {
    (async () => {
      try {
        const session = JSON.parse(localStorage.getItem('fitcoach_user') || 'null');
        if (session?.id) {
          const { db } = await import('../../utils/db');
          const sessions = await db.sessions.where({ userId: session.id }).toArray();
          const totalWorkouts = sessions.length;
          const calories = 0; // placeholder: in real case compute
          setProgressData(prev => ({ ...prev, totalWorkouts, caloriesBurned: calories, completedWorkouts: 0, currentStreak: 0 }));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    // Use class instead of data attribute for Tailwind dark mode
    if (savedTheme === 'dark') {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
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
    localStorage.removeItem('theme');
    navigate('/login-screen', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={handleThemeToggle}
        currentTheme={currentTheme}
        user={user}
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
          {/* Welcome Section */}
          <WelcomeSection user={user} />

          {/* Today's Workout */}
          <TodayWorkoutCard workoutData={{
            name: "Full Body Strength",
            scheduledTime: "6:00 PM",
            exercises: [
              { name: "Push-ups", sets: 3, reps: 15, completed: true },
              { name: "Squats", sets: 3, reps: 20, completed: true },
              { name: "Plank", sets: 3, duration: "30s", completed: false },
              { name: "Lunges", sets: 3, reps: 12, completed: false },
              { name: "Mountain Climbers", sets: 3, reps: 15, completed: false }
            ],
            estimatedDuration: 30,
            difficulty: "Intermediate"
          }} />

          {/* Quick Actions removed as requested */}

          {/* Progress & Tips Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <ProgressWidget progressData={progressData} />
            </div>
            <div>
              <DailyTipsCard />
            </div>
          </div>

          {/* Exercise Library */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Exercise Library
                </h2>
                <p className="text-muted-foreground">
                  Choose from our collection of home-friendly exercises
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {exercises?.length} exercises available
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedExercises?.map((exercise) => (
                <ExerciseCard key={exercise?.id} exercise={exercise} />
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-border">
            <div className="text-center text-sm text-muted-foreground">
              <p>© {new Date()?.getFullYear()} FitCoach AI. All rights reserved.</p>
              <p className="mt-2">Your AI-powered fitness companion for a healthier lifestyle.</p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;