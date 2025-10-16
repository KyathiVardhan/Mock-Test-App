import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MockTest from './pages/MockTest';
import TestResults from './pages/TestResults';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import DifficultySelection from './pages/DifficultySelection';
import AdminPage from './pages/AdminPage';
import { PrivateRoute } from './components/PrivateRoute';
import AdminDashboard from './pages/AdminDashboard';
import AddTest from './pages/AddTest';
import AddExam from './pages/AddExam';
import ManageExams from './pages/ManageExams';
import AddQuestionsToSubject from './pages/AddQuestionsToSubject';
import AddNewSubjectToExam from './pages/AddNewSubjectToExam';
// import MockExam from './pages/MockExam';
import ExamQuestions from './pages/ExamQuestions';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only redirect to login if we're sure the user is not authenticated
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is logged in, redirect to dashboard
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            
            <Route path="/adminPage" element={
              <PublicRoute>
                <AdminPage />
              </PublicRoute>
            } />

            <Route path='/admin/dashboard' element={
              <PublicRoute>
                <AdminDashboard/>
              </PublicRoute>
            } />
            <Route path='/admin/add-test' element={
              <PublicRoute>
                <AddTest/>
              </PublicRoute>
            } />
            <Route path='/admin/add-exam' element={
              <PublicRoute>
                <AddExam/>
              </PublicRoute>
            } />
            <Route path='/admin/manage-exams' element={
              <PublicRoute>
                <ManageExams/>
              </PublicRoute>
            } />
            <Route path='/admin/add-questions-to-subject' element={
              <PublicRoute>
                <AddQuestionsToSubject/>
              </PublicRoute>
            } />
            <Route path='/admin/add-new-subject' element={
              <PublicRoute>
                <AddNewSubjectToExam/>
              </PublicRoute>
            } />
            
            {/* <Route path="/MockExam" element={<MockExam />} /> */}
            <Route path="/ExamQuestions" element={<ExamQuestions />} />
            
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/results/:testId" element={
              <ProtectedRoute>
                <TestResults />
              </ProtectedRoute>
            } />

            {/* New routes for difficulty selection and tests */}
            <Route
              path="/test/:subject"
              element={<ProtectedRoute><DifficultySelection /></ProtectedRoute>}
            />
            <Route
              path="/test/:subject/difficulty/:difficulty"
              element={<ProtectedRoute><MockTest /></ProtectedRoute>}
            />
            <Route path="/subscription" element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;