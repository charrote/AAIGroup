import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AICharacterManager from './components/AICharacterManager';
import AIInteraction from './components/AIInteraction';
import AIConfigManager from './components/AIConfigManager';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/characters" 
              element={
                <ProtectedRoute>
                  <AICharacterManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-interaction" 
              element={
                <ProtectedRoute>
                  <AIInteraction />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-config" 
              element={
                <ProtectedRoute>
                  <AIConfigManager />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;