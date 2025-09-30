// Test CouchDB connection via proxy
async function testCouchDBConnection() {
  try {
    console.log('Testing CouchDB connection via proxy...')
    
    // Test the proxy endpoint directly
    const response = await fetch('/api/couchdb/zoomies_users', {
      headers: {
        'Authorization': 'Basic ' + btoa('admin:password')
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const info = await response.json()
    console.log('✓ CouchDB proxy connection successful')
    console.log('Database info:', info)

    // Test querying users
    const queryResponse = await fetch('/api/couchdb/zoomies_users/_find', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('admin:password')
      },
      body: JSON.stringify({
        selector: { type: 'user' },
        limit: 5
      })
    })
    
    if (!queryResponse.ok) {
      throw new Error(`Query error! status: ${queryResponse.status}`)
    }
    
    const result = await queryResponse.json()
    console.log('✓ Query successful, found users:', result.docs.length)
    result.docs.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`)
    })
    
    return true
  } catch (error) {
    console.error('✗ CouchDB connection failed:', error)
    return false
  }
}

// Export for use in components
export { testCouchDBConnection }
