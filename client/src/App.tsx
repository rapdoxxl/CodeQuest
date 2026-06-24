import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import LevelMap from './pages/LevelMap'
import Level from './pages/Level'
import KnowledgeGraph from './pages/KnowledgeGraph'
import Shop from './pages/Shop'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Achievements from './pages/Achievements'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/map" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/map" />} />
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/map" element={isAuthenticated ? <LevelMap /> : <Navigate to="/login" />} />
        <Route path="/level/:id" element={isAuthenticated ? <Level /> : <Navigate to="/login" />} />
        <Route path="/knowledge" element={isAuthenticated ? <KnowledgeGraph /> : <Navigate to="/login" />} />
        <Route path="/achievements" element={isAuthenticated ? <Achievements /> : <Navigate to="/login" />} />
        <Route path="/shop" element={isAuthenticated ? <Shop /> : <Navigate to="/login" />} />
        <Route path="/ladder" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
