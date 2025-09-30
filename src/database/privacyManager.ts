// Privacy Manager
export class PrivacyManager {
  private consentGiven = false
  private encryptionKey: CryptoKey | null = null
  private readonly CONSENT_KEY = 'zoomies_consent'
  private readonly ENCRYPTION_KEY_NAME = 'zoomies_encryption_key'

  constructor() {
    this.loadConsentStatus()
  }

  // Load consent status
  private loadConsentStatus(): void {
    const stored = localStorage.getItem(this.CONSENT_KEY)
    if (stored) {
      try {
        const consentData = JSON.parse(stored)
        this.consentGiven = consentData.given || false
      } catch (error) {
        console.error('Failed to load consent status:', error)
      }
    }
  }

  // Request user consent
  async requestConsent(): Promise<boolean> {
    if (this.consentGiven) return true

    // Auto-accept consent for development
    console.log('Auto-accepting privacy consent for development')
    this.grantConsent()
    return true

    // Original consent dialog code (commented out for development)
    /*
    return new Promise((resolve) => {
      // Create consent dialog
      const consentDialog = this.createConsentDialog((accepted) => {
        if (accepted) {
          this.grantConsent()
        }
        resolve(accepted)
      })

      document.body.appendChild(consentDialog)
    })
    */
  }

  // Create consent dialog (commented out for development)
  /*
  private createConsentDialog(onResponse: (accepted: boolean) => void): HTMLElement {
    const dialog = document.createElement('div')
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `

    const content = document.createElement('div')
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      margin: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `

    content.innerHTML = `
      <h2 style="margin-top: 0; color: #333;">Privacy Consent Statement</h2>
      <p>Zoomies needs to collect the following data to provide you with personalized learning support:</p>
      <ul>
        <li><strong>注意力數據</strong>：檢測您的專注狀態（不包含圖像或視頻）</li>
        <li><strong>學習會話</strong>：記錄學習時間、科目和進度</li>
        <li><strong>互動數據</strong>：考拉寵物的提醒和您的回應</li>
      </ul>
      <p><strong>Privacy Protection:</strong></p>
      <ul>
        <li>All data is stored only on your device</li>
        <li>Not uploaded to any server</li>
        <li>You can delete all data at any time</li>
        <li>Data will be automatically cleaned after 30 days</li>
      </ul>
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="accept-btn" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        ">Agree and Start</button>
        <button id="decline-btn" style="
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        ">Reject</button>
      </div>
    `

    dialog.appendChild(content)

    // Add event listeners
    content.querySelector('#accept-btn')?.addEventListener('click', () => {
      document.body.removeChild(dialog)
      onResponse(true)
    })

    content.querySelector('#decline-btn')?.addEventListener('click', () => {
      document.body.removeChild(dialog)
      onResponse(false)
    })

    return dialog
  }
  */

  // Grant consent
  private grantConsent(): void {
    this.consentGiven = true
    const consentData = {
      given: true,
      date: new Date().toISOString(),
      version: '1.0'
    }
    localStorage.setItem(this.CONSENT_KEY, JSON.stringify(consentData))
  }

  // Revoke consent
  revokeConsent(): void {
    this.consentGiven = false
    localStorage.removeItem(this.CONSENT_KEY)
    this.clearAllData()
  }

  // Check if already consented
  hasConsent(): boolean {
    return this.consentGiven
  }

  // Initialize encryption
  async initializeEncryption(): Promise<void> {
    if (!this.consentGiven) return

    try {
      // Try to get existing key from IndexedDB
      this.encryptionKey = await this.getStoredEncryptionKey()
      
      if (!this.encryptionKey) {
        // Generate new encryption key
        this.encryptionKey = await crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256
          },
          true,
          ['encrypt', 'decrypt']
        )
        
        // Store key
        await this.storeEncryptionKey()
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error)
    }
  }

  // Get stored encryption key
  private async getStoredEncryptionKey(): Promise<CryptoKey | null> {
    try {
      const keyData = localStorage.getItem(this.ENCRYPTION_KEY_NAME)
      if (!keyData) return null

      const keyBuffer = new Uint8Array(JSON.parse(keyData))
      return await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      )
    } catch (error) {
      console.error('Failed to get stored encryption key:', error)
      return null
    }
  }

  // Store encryption key
  private async storeEncryptionKey(): Promise<void> {
    if (!this.encryptionKey) return

    try {
      const keyBuffer = await crypto.subtle.exportKey('raw', this.encryptionKey)
      const keyArray = Array.from(new Uint8Array(keyBuffer))
      localStorage.setItem(this.ENCRYPTION_KEY_NAME, JSON.stringify(keyArray))
    } catch (error) {
      console.error('Failed to store encryption key:', error)
    }
  }

  // Encrypt sensitive data
  async encryptSensitiveData(data: string): Promise<string> {
    if (!this.encryptionKey || !this.consentGiven) return data

    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const iv = crypto.getRandomValues(new Uint8Array(12))
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.encryptionKey,
        dataBuffer
      )

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encryptedBuffer), iv.length)

      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('Failed to encrypt data:', error)
      return data
    }
  }

  // Decrypt sensitive data
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey || !this.consentGiven) return encryptedData

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )

      const iv = combined.slice(0, 12)
      const encrypted = combined.slice(12)

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.encryptionKey,
        encrypted
      )

      const decoder = new TextDecoder()
      return decoder.decode(decryptedBuffer)
    } catch (error) {
      console.error('Failed to decrypt data:', error)
      return encryptedData
    }
  }

  // Clean all data
  async clearAllData(): Promise<void> {
    try {
      // Clean localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('zoomies')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Clean IndexedDB
      const databases = ['zoomies-sessions', 'zoomies-events', 'zoomies-metrics', 'zoomies-settings']
      for (const dbName of databases) {
        try {
          const deleteRequest = indexedDB.deleteDatabase(dbName)
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve(undefined)
            deleteRequest.onerror = () => reject(deleteRequest.error)
          })
        } catch (error) {
          console.error(`Failed to delete database ${dbName}:`, error)
        }
      }

      // Reset state
      this.consentGiven = false
      this.encryptionKey = null

      console.log('All Zoomies data cleared')
    } catch (error) {
      console.error('Failed to clear all data:', error)
    }
  }

  // Export data (for backup)
  async exportUserData(): Promise<{
    consent: any
    settings: any
    sessions: any[]
    events: any[]
    metrics: any[]
  }> {
    if (!this.consentGiven) {
      throw new Error('No consent given for data export')
    }

    try {
      // Need to get data from database here
      // For simplicity, return basic structure
      return {
        consent: JSON.parse(localStorage.getItem(this.CONSENT_KEY) || '{}'),
        settings: {},
        sessions: [],
        events: [],
        metrics: []
      }
    } catch (error) {
      console.error('Failed to export user data:', error)
      throw error
    }
  }

  // Get privacy settings
  getPrivacySettings(): {
    consentGiven: boolean
    dataRetentionDays: number
    allowAnalytics: boolean
  } {
    return {
      consentGiven: this.consentGiven,
      dataRetentionDays: 30,
      allowAnalytics: false
    }
  }
}

// Export singleton instance
export const privacyManager = new PrivacyManager()
export default privacyManager
