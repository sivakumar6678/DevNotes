import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'
import Categories from './pages/Categories'
import Home from './pages/Home'
import NotePage from './pages/NotePage'
import NotFound from './pages/NotFound'
import Technologies from './pages/Technologies'
import Topics from './pages/Topics'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CurriculumPage from './pages/CurriculumPage'
import ProtectedRoute from './components/ProtectedRoute'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'about', element: <About /> },
        { path: 'categories', element: <Categories /> },
        { path: 'technologies', element: <Technologies /> },
        { path: 'topics/:tech_slug', element: <Topics /> },
        { path: 'notes/:slug', element: <NotePage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'signup', element: <SignupPage /> },
        {
          path: 'admin',
          element: (
            <ProtectedRoute requireAdmin>
              <CurriculumPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/dashboard',
          element: (
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: 'curriculum',
          element: (
            <ProtectedRoute requireAdmin>
              <CurriculumPage />
            </ProtectedRoute>
          ),
        },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    } as any,
  } as any
)

function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}

export default App
