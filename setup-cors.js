// Setup CORS for CouchDB
const COUCHDB_URL = 'http://localhost:5984'

async function setupCORS() {
  try {
    console.log('Setting up CORS for CouchDB...')
    
    // Enable CORS
    const corsResponse = await fetch(`${COUCHDB_URL}/_config/cors`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64')
      },
      body: JSON.stringify({
        origins: '*',
        credentials: true,
        headers: 'accept, authorization, content-type, origin, referer',
        methods: 'GET, POST, PUT, DELETE, OPTIONS'
      })
    })
    
    if (corsResponse.ok) {
      console.log('✓ CORS configured successfully')
    } else {
      console.log('CORS response:', await corsResponse.text())
    }
    
    // Test CORS
    const testResponse = await fetch(`${COUCHDB_URL}/_config/cors`, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('admin:password').toString('base64')
      }
    })
    if (testResponse.ok) {
      const config = await testResponse.json()
      console.log('✓ CORS configuration:', config)
    }
    
  } catch (error) {
    console.error('Failed to setup CORS:', error)
  }
}

setupCORS()
