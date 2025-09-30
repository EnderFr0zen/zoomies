import PouchDB from 'pouchdb'
import PouchDBFind from 'pouchdb-find'

PouchDB.plugin(PouchDBFind)

const COUCHDB_URL = 'http://admin:password@localhost:5984'
const DATABASE_NAMES = {
  USERS: 'zoomies_users',
  COURSES: 'zoomies_courses',
  SESSIONS: 'zoomies_sessions',
  EVENTS: 'zoomies_events',
  METRICS: 'zoomies_metrics',
  SETTINGS: 'zoomies_settings'
}

async function setupCouchDB() {
  console.log('Setting up CouchDB databases...')
  
  try {
    // Create databases
    const databases = [
      `${COUCHDB_URL}/${DATABASE_NAMES.USERS}`,
      `${COUCHDB_URL}/${DATABASE_NAMES.COURSES}`,
      `${COUCHDB_URL}/${DATABASE_NAMES.SESSIONS}`,
      `${COUCHDB_URL}/${DATABASE_NAMES.EVENTS}`,
      `${COUCHDB_URL}/${DATABASE_NAMES.METRICS}`,
      `${COUCHDB_URL}/${DATABASE_NAMES.SETTINGS}`
    ]

    for (const dbUrl of databases) {
      const db = new PouchDB(dbUrl)
      try {
        await db.info()
        console.log(`✓ Database ${dbUrl} already exists`)
      } catch (error) {
        if (error.status === 404) {
          await db.create()
          console.log(`✓ Created database ${dbUrl}`)
        } else {
          throw error
        }
      }
    }

    // Create indexes for better performance
    const usersDB = new PouchDB(`${COUCHDB_URL}/${DATABASE_NAMES.USERS}`)
    const coursesDB = new PouchDB(`${COUCHDB_URL}/${DATABASE_NAMES.COURSES}`)
    const sessionsDB = new PouchDB(`${COUCHDB_URL}/${DATABASE_NAMES.SESSIONS}`)
    const eventsDB = new PouchDB(`${COUCHDB_URL}/${DATABASE_NAMES.EVENTS}`)
    const metricsDB = new PouchDB(`${COUCHDB_URL}/${DATABASE_NAMES.METRICS}`)

    console.log('Creating database indexes...')

    // Users indexes
    await usersDB.createIndex({ index: { fields: ['username'] } })
    await usersDB.createIndex({ index: { fields: ['role'] } })
    await usersDB.createIndex({ index: { fields: ['teacherId'] } })

    // Courses indexes
    await coursesDB.createIndex({ index: { fields: ['teacherId'] } })
    await coursesDB.createIndex({ index: { fields: ['studentIds'] } })
    await coursesDB.createIndex({ index: { fields: ['isActive'] } })

    // Sessions indexes
    await sessionsDB.createIndex({ index: { fields: ['userId'] } })
    await sessionsDB.createIndex({ index: { fields: ['startedAt'] } })

    // Events indexes
    await eventsDB.createIndex({ index: { fields: ['sessionId'] } })
    await eventsDB.createIndex({ index: { fields: ['userId'] } })
    await eventsDB.createIndex({ index: { fields: ['timestamp'] } })

    // Metrics indexes
    await metricsDB.createIndex({ index: { fields: ['userId'] } })
    await metricsDB.createIndex({ index: { fields: ['sessionId'] } })

    console.log('✓ All indexes created successfully')

    // Create default users
    console.log('Creating default users...')
    const defaultUsers = [
      {
        _id: 'user_teacher1',
        username: 'teacher1',
        email: 'teacher1@zoomies.com',
        role: 'teacher',
        displayName: 'Mr. Smith',
        isActive: true,
        enrolledCourses: [],
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        type: 'user',
        schemaVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'user_student1',
        username: 'student1',
        email: 'student1@zoomies.com',
        role: 'student',
        displayName: 'Alice',
        isActive: true,
        teacherId: 'user_teacher1',
        enrolledCourses: [],
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        type: 'user',
        schemaVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'user_student2',
        username: 'student2',
        email: 'student2@zoomies.com',
        role: 'student',
        displayName: 'Bob',
        isActive: true,
        teacherId: 'user_teacher1',
        enrolledCourses: [],
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        type: 'user',
        schemaVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'user_student3',
        username: 'student3',
        email: 'student3@zoomies.com',
        role: 'student',
        displayName: 'Carol',
        isActive: true,
        teacherId: 'user_teacher1',
        enrolledCourses: [],
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true
        },
        type: 'user',
        schemaVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    for (const user of defaultUsers) {
      try {
        await usersDB.get(user._id)
        console.log(`✓ User ${user.username} already exists`)
      } catch (error) {
        if (error.status === 404) {
          await usersDB.put(user)
          console.log(`✓ Created user ${user.username}`)
        } else {
          throw error
        }
      }
    }

    console.log('✓ CouchDB setup completed successfully!')
    console.log('')
    console.log('CouchDB is running at: http://localhost:5984')
    console.log('Username: admin')
    console.log('Password: password')
    console.log('')
    console.log('You can now start your React app with: npm run dev')

  } catch (error) {
    console.error('Failed to setup CouchDB:', error)
    process.exit(1)
  }
}

setupCouchDB()
