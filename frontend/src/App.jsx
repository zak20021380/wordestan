import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';

// Pages
import Home from './pages/Home';
import Game from './pages/Game';
import LevelMap from './pages/LevelMap';
import Store from './pages/Store';
import PaymentVerify from './pages/PaymentVerify';
import Leaderboard from './pages/Leaderboard';
import LeitnerBox from './pages/LeitnerBox';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './components/admin/AdminDashboard';
import LevelManagement from './components/admin/LevelManagement';
import CoinPackManagement from './components/admin/CoinPackManagement';
import RewardSettings from './components/admin/RewardSettings';
import UserManagement from './components/admin/UserManagement';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GameProvider>
          <Router>
            <div className="min-h-screen bg-wood bg-cover bg-center bg-fixed">
              {/* Wooden background overlay */}
              <div className="min-h-screen bg-gradient-to-br from-wood-900/80 via-wood-800/60 to-wood-900/80">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected routes with layout */}
                  <Route path="/*" element={
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/game" element={<Game />} />
                        <Route
                          path="/levels"
                          element={
                            <ProtectedRoute>
                              <LevelMap />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/leitner" element={<LeitnerBox />} />
                        <Route
                          path="/store"
                          element={
                            <ProtectedRoute>
                              <Store />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/payment/verify"
                          element={
                            <ProtectedRoute>
                              <PaymentVerify />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        
                        {/* Admin routes */}
                        <Route
                          path="/admin/*"
                          element={
                            <AdminRoute>
                              <Admin />
                            </AdminRoute>
                          }
                        >
                          <Route index element={<AdminDashboard />} />
                          <Route path="levels" element={<LevelManagement />} />
                          <Route path="coin-packs" element={<CoinPackManagement />} />
                          <Route path="settings/rewards" element={<RewardSettings />} />
                          <Route path="users" element={<UserManagement />} />
                          <Route path="*" element={<AdminDashboard />} />
                        </Route>
                        
                        {/* 404 route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Layout>
                  } />
                </Routes>
                
                {/* Toast notifications */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                    },
                    success: {
                      iconTheme: {
                        primary: '#34d399',
                        secondary: 'white',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: 'white',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </Router>
        </GameProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;