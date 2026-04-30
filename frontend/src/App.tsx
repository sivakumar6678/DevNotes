import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import AdminDashboard from './pages/AdminDashboard'

import Home from './pages/Home'
import NotePage from './pages/NotePage'
import NotFound from './pages/NotFound'
import Technologies from './pages/Technologies'
import Topics from './pages/Topics'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import CurriculumPage from './pages/CurriculumPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import ManageUsers from './pages/ManageUsers'
import { Navigate } from 'react-router-dom'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'about', element: <About /> },

        { path: 'technologies', element: <Technologies /> },
        { path: 'topics/:tech_slug', element: <Topics /> },
        { path: 'notes/:slug', element: <NotePage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'signup', element: <SignupPage /> },
        {
          path: 'admin',
          element: (
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          ),
          children: [
            { index: true, element: <Navigate to="curriculum" replace /> },
            { path: 'curriculum', element: <CurriculumPage /> },
            { path: 'dashboard', element: <AdminDashboard /> },
            { path: 'users', element: <ManageUsers /> },
          ]
        },
        {
          path: 'curriculum',
          element: <Navigate to="/admin/curriculum" replace />
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
