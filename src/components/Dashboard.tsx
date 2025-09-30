import React from 'react'
import './Dashboard.css'
import PerformanceChart from './PerformanceChart'
import KeyMetrics from './KeyMetrics'
import Homework from './Homework'
import Classes from './Classes'
import UpcomingEvents from './UpcomingEvents'
import Projects from './Projects'

const Dashboard: React.FC = () => {
  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>
      
      <div className="dashboard-content">
        {/* Top Row */}
        <div className="dashboard-row">
          <div className="chart-container">
            <PerformanceChart />
          </div>
          <div className="metrics-container">
            <KeyMetrics />
          </div>
          <div className="homework-container">
            <Homework />
          </div>
        </div>
        
        {/* Middle Row */}
        <div className="dashboard-row">
          <div className="classes-container">
            <Classes />
          </div>
          <div className="events-container">
            <UpcomingEvents />
          </div>
        </div>
        
        {/* Bottom Row */}
        <div className="dashboard-row">
          <div className="projects-container">
            <Projects />
          </div>
        </div>
      </div>
    </main>
  )
}

export default Dashboard
