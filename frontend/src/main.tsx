import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CurriculumProvider } from './context/CurriculumContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CurriculumProvider>
        <App />
      </CurriculumProvider>
    </AuthProvider>
  </React.StrictMode>,
)
