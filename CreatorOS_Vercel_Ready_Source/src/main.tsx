import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CommunityProvider } from './context/CommunityContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CommunityProvider>
          <App />
        </CommunityProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
