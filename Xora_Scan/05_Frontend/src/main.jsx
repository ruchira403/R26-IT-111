// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// // 💡 BrowserRouter එක මෙතනට Import කරන්න
// import { BrowserRouter as Router } from 'react-router-dom'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// 💡 BrowserRouter එක මෙතනට Import කරන්න
import { BrowserRouter as Router } from 'react-router-dom' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🚀 මුළු App එකම Router එකෙන් Cover කරන්න */}
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)