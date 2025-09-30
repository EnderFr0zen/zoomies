import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'

PouchDB.plugin(PouchDBFind)

const COUCHDB_URL = 'http://admin:password@localhost:5984'

async function testCouchDB() {
  console.log('Testing CouchDB connection...')
  
  try {
    // Test connection
    const usersDB = new PouchDB(`${COUCHDB_URL}/zoomies_users`)
    const info = await usersDB.info()
    console.log('✓ CouchDB connection successful')
    console.log(`Database name: ${info.db_name}`)
    console.log(`Document count: ${info.doc_count}`)
    
    // Test user retrieval
    const users = await usersDB.find({
      selector: { type: 'user' }
    })
    console.log(`✓ Found ${users.docs.length} users:`)
    users.docs.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`)
    })
    
    // Test course database
    const coursesDB = new PouchDB(`${COUCHDB_URL}/zoomies_courses`)
    const courses = await coursesDB.find({
      selector: { type: 'course' }
    })
    console.log(`✓ Found ${courses.docs.length} courses`)
    
    console.log('✓ All tests passed! CouchDB is working correctly.')
    
  } catch (error) {
    console.error('✗ CouchDB test failed:', error.message)
    process.exit(1)
  }
}

testCouchDB()
