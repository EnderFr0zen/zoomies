import React from 'react'
import './PerformanceChart.css'

const PerformanceChart: React.FC = () => {
  return (
    <div className="performance-chart">
      <h3 className="chart-title">Performance</h3>
      <div className="chart-container">
        <svg viewBox="0 0 400 200" className="chart-svg">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y-axis labels */}
          <text x="10" y="20" className="axis-label">120</text>
          <text x="10" y="50" className="axis-label">100</text>
          <text x="10" y="80" className="axis-label">80</text>
          <text x="10" y="110" className="axis-label">60</text>
          <text x="10" y="140" className="axis-label">40</text>
          <text x="10" y="170" className="axis-label">20</text>
          
          {/* X-axis labels */}
          <text x="80" y="190" className="axis-label">Week 1</text>
          <text x="140" y="190" className="axis-label">Week 2</text>
          <text x="200" y="190" className="axis-label">Week 3</text>
          <text x="260" y="190" className="axis-label">Week 4</text>
          <text x="320" y="190" className="axis-label">Week 5</text>
          
          {/* Purple line */}
          <polyline
            points="60,160 120,140 180,120 240,100 300,80"
            fill="none"
            stroke="#9C27B0"
            strokeWidth="3"
            className="chart-line"
          />
          
          {/* Light green line */}
          <polyline
            points="60,150 120,130 180,110 240,90 300,70"
            fill="none"
            stroke="#4CAF50"
            strokeWidth="3"
            className="chart-line"
          />
          
          {/* Teal line */}
          <polyline
            points="60,170 120,150 180,130 240,110 300,90"
            fill="none"
            stroke="#00BCD4"
            strokeWidth="3"
            className="chart-line"
          />
          
          {/* Data points */}
          <circle cx="60" cy="160" r="4" fill="#9C27B0" />
          <circle cx="120" cy="140" r="4" fill="#9C27B0" />
          <circle cx="180" cy="120" r="4" fill="#9C27B0" />
          <circle cx="240" cy="100" r="4" fill="#9C27B0" />
          <circle cx="300" cy="80" r="4" fill="#9C27B0" />
          
          <circle cx="60" cy="150" r="4" fill="#4CAF50" />
          <circle cx="120" cy="130" r="4" fill="#4CAF50" />
          <circle cx="180" cy="110" r="4" fill="#4CAF50" />
          <circle cx="240" cy="90" r="4" fill="#4CAF50" />
          <circle cx="300" cy="70" r="4" fill="#4CAF50" />
          
          <circle cx="60" cy="170" r="4" fill="#00BCD4" />
          <circle cx="120" cy="150" r="4" fill="#00BCD4" />
          <circle cx="180" cy="130" r="4" fill="#00BCD4" />
          <circle cx="240" cy="110" r="4" fill="#00BCD4" />
          <circle cx="300" cy="90" r="4" fill="#00BCD4" />
        </svg>
      </div>
    </div>
  )
}

export default PerformanceChart
