import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { LoginForm } from './components/LoginForm'
import { RegistrationForm } from './components/RegistrationForm'
import { ProtectedRoute } from './components/ProtectedRoute'
import { IdeaList } from './components/IdeaList'
import { IdeaDetail } from './components/IdeaDetail'
import { IdeaSubmissionForm } from './components/IdeaSubmissionForm'
import { UserProfile } from './components/UserProfile'
import { ProfileEditor } from './components/ProfileEditor'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/ideas" element={<IdeaList />} />
            <Route path="/ideas/:id" element={<IdeaDetail />} />
            <Route 
              path="/ideas/new" 
              element={
                <ProtectedRoute>
                  <IdeaSubmissionForm />
                </ProtectedRoute>
              } 
            />
            <Route path="/users/:userId" element={<UserProfile />} />
            <Route 
              path="/users/:userId/edit" 
              element={
                <ProtectedRoute>
                  <ProfileEditor />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
