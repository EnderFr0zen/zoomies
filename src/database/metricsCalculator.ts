import type { EventDocument, MetricsDocument, SessionDocument } from './types'
import { zoomiesDB } from './couchdb-simple'

// 指標計算器類
export class MetricsCalculator {
  private updateInterval: number | null = null
  private readonly UPDATE_FREQUENCY = 30000 // 30秒更新一次

  // 計算會話指標
  async calculateSessionMetrics(sessionId: string): Promise<MetricsDocument> {
    const events = await zoomiesDB.getEventsBySession(sessionId)
    const session = await zoomiesDB.getSession(sessionId)
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const metrics = this.processEvents(events, session)
    return metrics
  }

  // 處理事件並計算指標
  private processEvents(events: EventDocument[], session: SessionDocument): MetricsDocument {
    const sessionStart = new Date(session.startedAt).getTime()
    const sessionEnd = session.endedAt ? new Date(session.endedAt).getTime() : Date.now()
    const totalSessionTime = Math.floor((sessionEnd - sessionStart) / 1000) // 秒

    // 初始化指標
    let focusedTime = 0
    let distractedTime = 0
    let totalNudges = 0
    let nudge1Count = 0
    let nudge2Count = 0
    let responseTimes: number[] = []

    const attentionEvents = {
      present: 0,
      lost: 0,
      regained: 0
    }

    const focusHistory: Array<{ timestamp: string; focusLevel: number }> = []
    const hourlyBreakdown: Array<{ hour: number; focusPercentage: number; nudgeCount: number }> = []

    // 追蹤狀態
    let isFocused = true
    let lastAttentionTime = sessionStart
    let lastNudgeTime = 0
    let currentHour = new Date(sessionStart).getHours()

    // 按時間排序事件
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // 處理每個事件
    for (const event of sortedEvents) {
      const eventTime = new Date(event.timestamp).getTime()
      const eventHour = new Date(event.timestamp).getHours()

      // 更新小時統計
      if (eventHour !== currentHour) {
        const hourFocusPercentage = lastAttentionTime > 0 ? 
          Math.max(0, Math.min(100, (focusedTime / (eventTime - sessionStart)) * 100)) : 0
        
        hourlyBreakdown.push({
          hour: currentHour,
          focusPercentage: hourFocusPercentage,
          nudgeCount: totalNudges
        })
        currentHour = eventHour
      }

      // 計算時間差
      const timeDiff = Math.floor((eventTime - lastAttentionTime) / 1000)
      
      if (isFocused) {
        focusedTime += timeDiff
      } else {
        distractedTime += timeDiff
      }

      // 處理不同類型的事件
      switch (event.eventType) {
        case 'attention:present':
          attentionEvents.present++
          if (!isFocused) {
            // 從分心恢復
            const responseTime = lastNudgeTime > 0 ? 
              Math.floor((eventTime - lastNudgeTime) / 1000) : 0
            if (responseTime > 0) {
              responseTimes.push(responseTime)
            }
            attentionEvents.regained++
          }
          isFocused = true
          focusHistory.push({
            timestamp: event.timestamp,
            focusLevel: event.data.attentionLevel || 1
          })
          break

        case 'attention:lost':
          attentionEvents.lost++
          isFocused = false
          focusHistory.push({
            timestamp: event.timestamp,
            focusLevel: 0
          })
          break

        case 'nudge1:shown':
          nudge1Count++
          totalNudges++
          lastNudgeTime = eventTime
          break

        case 'nudge2:shown':
          nudge2Count++
          totalNudges++
          lastNudgeTime = eventTime
          break

        case 'focus:regained':
          if (event.data.metadata?.responseTime) {
            responseTimes.push(event.data.metadata.responseTime)
          }
          break
      }

      lastAttentionTime = eventTime
    }

    // 計算最終指標
    const focusPercentage = totalSessionTime > 0 ? 
      Math.max(0, Math.min(100, (focusedTime / totalSessionTime) * 100)) : 0

    const averageResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0

    // 添加最後一個小時的統計
    const finalHourFocusPercentage = lastAttentionTime > 0 ? 
      Math.max(0, Math.min(100, (focusedTime / (sessionEnd - sessionStart)) * 100)) : 0
    
    hourlyBreakdown.push({
      hour: currentHour,
      focusPercentage: finalHourFocusPercentage,
      nudgeCount: totalNudges
    })

    // 創建指標文檔
    const metrics: Omit<MetricsDocument, keyof import('./types').BaseDocument> = {
      type: 'metrics',
      sessionId: session._id,
      userId: session.userId || 'default-user',
      sessionStartTime: session.startedAt,
      sessionEndTime: session.endedAt,
      focusPercentage: Math.round(focusPercentage * 100) / 100,
      totalNudges,
      nudge1Count,
      nudge2Count,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      totalSessionTime,
      focusedTime,
      distractedTime,
      attentionEvents,
      focusHistory: focusHistory.slice(-100), // 保留最近100個記錄
      hourlyBreakdown
    }

    return metrics as MetricsDocument
  }

  // 實時更新指標
  startRealTimeUpdates(sessionId: string): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    this.updateInterval = window.setInterval(async () => {
      try {
        await this.updateSessionMetrics(sessionId)
      } catch (error) {
        console.error('Failed to update session metrics:', error)
      }
    }, this.UPDATE_FREQUENCY)
  }

  // 停止實時更新
  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  // 更新會話指標
  async updateSessionMetrics(sessionId: string): Promise<void> {
    try {
      const metrics = await this.calculateSessionMetrics(sessionId)
      
      // 檢查是否已存在指標文檔
      const existingMetrics = await zoomiesDB.getMetricsBySession(sessionId)
      
      if (existingMetrics) {
        await zoomiesDB.updateMetrics(sessionId, metrics)
      } else {
        await zoomiesDB.createMetrics(metrics)
      }
      
      console.log(`Updated metrics for session ${sessionId}`)
    } catch (error) {
      console.error('Failed to update session metrics:', error)
    }
  }

  // 計算總體統計
  async calculateOverallStats(timeRange?: { start: string; end: string }): Promise<{
    totalSessions: number
    averageFocusPercentage: number
    totalNudges: number
    averageSessionDuration: number
    mostDistractedSubject: string
    improvementTrend: number
  }> {
    const sessions = await zoomiesDB.getRecentSessions(1000) // 獲取最近1000個會話
    
    let filteredSessions = sessions
    if (timeRange) {
      filteredSessions = sessions.filter(session => 
        session.startedAt >= timeRange.start && 
        session.startedAt <= timeRange.end
      )
    }

    if (filteredSessions.length === 0) {
      return {
        totalSessions: 0,
        averageFocusPercentage: 0,
        totalNudges: 0,
        averageSessionDuration: 0,
        mostDistractedSubject: '',
        improvementTrend: 0
      }
    }

    // 計算基本統計
    const totalSessions = filteredSessions.length
    let totalFocusPercentage = 0
    let totalNudges = 0
    let totalDuration = 0
    const subjectStats: Record<string, { sessions: number; nudges: number }> = {}

    // 獲取每個會話的指標
    for (const session of filteredSessions) {
      const metricsArray = await zoomiesDB.getMetricsBySession(session._id)
      if (metricsArray && metricsArray.length > 0) {
        const metrics = metricsArray[0] // Get the most recent metrics
        totalFocusPercentage += metrics.focusPercentage
        totalNudges += metrics.totalNudges
        totalDuration += metrics.totalSessionTime

        // 按科目統計
        if (!subjectStats[session.subject]) {
          subjectStats[session.subject] = { sessions: 0, nudges: 0 }
        }
        subjectStats[session.subject].sessions++
        subjectStats[session.subject].nudges += metrics.totalNudges
      }
    }

    const averageFocusPercentage = totalSessions > 0 ? 
      Math.round((totalFocusPercentage / totalSessions) * 100) / 100 : 0

    const averageSessionDuration = totalSessions > 0 ? 
      Math.round((totalDuration / totalSessions) / 60) : 0 // 分鐘

    // 找出最容易分心的科目
    const mostDistractedSubject = Object.entries(subjectStats)
      .sort(([,a], [,b]) => (b.nudges / b.sessions) - (a.nudges / a.sessions))[0]?.[0] || ''

    // 計算改善趨勢（比較前半段和後半段）
    const halfPoint = Math.floor(filteredSessions.length / 2)
    const firstHalf = filteredSessions.slice(0, halfPoint)
    const secondHalf = filteredSessions.slice(halfPoint)

    let firstHalfFocus = 0
    let secondHalfFocus = 0

    for (const session of firstHalf) {
      const metricsArray = await zoomiesDB.getMetricsBySession(session._id)
      if (metricsArray && metricsArray.length > 0) {
        firstHalfFocus += metricsArray[0].focusPercentage
      }
    }

    for (const session of secondHalf) {
      const metricsArray = await zoomiesDB.getMetricsBySession(session._id)
      if (metricsArray && metricsArray.length > 0) {
        secondHalfFocus += metricsArray[0].focusPercentage
      }
    }

    const improvementTrend = firstHalf.length > 0 && secondHalf.length > 0 ?
      Math.round(((secondHalfFocus / secondHalf.length) - (firstHalfFocus / firstHalf.length)) * 100) / 100 : 0

    return {
      totalSessions,
      averageFocusPercentage,
      totalNudges,
      averageSessionDuration,
      mostDistractedSubject,
      improvementTrend
    }
  }

  // 生成學習建議
  generateLearningRecommendations(metrics: MetricsDocument): string[] {
    const recommendations: string[] = []

    if (metrics.focusPercentage < 50) {
      recommendations.push('專注度較低，建議增加休息時間或調整學習環境')
    }

    if (metrics.totalNudges > 10) {
      recommendations.push('提醒次數較多，建議檢查學習環境是否有干擾因素')
    }

    if (metrics.averageResponseTime > 30) {
      recommendations.push('對提醒的反應較慢，建議調整提醒敏感度')
    }

    if (metrics.nudge2Count > metrics.nudge1Count) {
      recommendations.push('需要更多強烈提醒，建議增加學習動機或調整任務難度')
    }

    const hourlyData = metrics.hourlyBreakdown || []
    const lowFocusHours = hourlyData.filter(h => h.focusPercentage < 30)
    if (lowFocusHours.length > 0) {
      recommendations.push(`在 ${lowFocusHours.map(h => h.hour + '點').join(', ')} 時段專注度較低，建議調整學習時間`)
    }

    return recommendations
  }
}

// 導出單例實例
export const metricsCalculator = new MetricsCalculator()
export default metricsCalculator
