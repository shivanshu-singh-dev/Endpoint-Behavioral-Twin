import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Chart as ChartJS, defaults } from 'chart.js'
import App from './App'
import './styles.css'

defaults.color = '#94a3b8'
defaults.borderColor = 'rgba(255, 255, 255, 0.08)'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
