import React from 'react'
import './App.css'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import KoalaPet from './components/KoalaPet'

function App() {
  return (
    <div className="app">
      <Header />
      <div className="main-layout">
        <Sidebar />
        <Dashboard />
      </div>
      <KoalaPet />
    </div>
  )
}

export default App
