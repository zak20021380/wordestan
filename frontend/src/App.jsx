import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { BattleProvider } from './contexts/BattleContext';

// Pages
import Home from './pages/Home';
import Game from './pages/Game';
import LevelMap from './pages/LevelMap';
import Store from './pages/Store';
import PaymentVerify from './pages/PaymentVerify';
import Leaderboard from './pages/Leaderboard';
import LeitnerBox from './pages/LeitnerBox';
import BattleLobby from './pages/BattleLobby';
import BattleGame from './pages/BattleGame';
import BattleResults from './pages/BattleResults';
import BattleHistory from './pages/BattleHistory';
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
import BattleWords from './pages/admin/BattleWords';

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
            <BattleProvider>
              <div className="min-h-screen">
                {/* Dark gradient overlay */}
                <div className="min-h-screen bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-slate-950/80">
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
                        <Route
                          path="/battle"
                          element={
                            <ProtectedRoute>
                              <BattleLobby />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/battle/live"
                          element={
                            <ProtectedRoute>
                              <BattleGame />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/battle/results"
                          element={
                            <ProtectedRoute>
                              <BattleResults />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/battle/history"
                          element={
                            <ProtectedRoute>
                              <BattleHistory />
                            </ProtectedRoute>
                          }
                        />
                        
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
                          <Route path="battle-words" element={<BattleWords />} />
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
            </BattleProvider>
          </Router>
        </GameProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;