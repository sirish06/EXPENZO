import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import GroupForm from './pages/GroupForm'
import GroupDetail from './pages/GroupDetail'
import AddExpense from './pages/AddExpense'
import TransactionHistory from './pages/TransactionHistory'
import Profile from './pages/Profile'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/groups/new" element={<ProtectedRoute><GroupForm /></ProtectedRoute>} />
            <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
            <Route path="/groups/:id/edit" element={<ProtectedRoute><GroupForm /></ProtectedRoute>} />
            <Route path="/groups/:id/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
