// Test script to verify clearAllCourses functionality
import { zoomiesDB } from './src/database/couchdb-simple.js'

async function testClearCourses() {
  try {
    console.log('Testing clearAllCourses functionality...')
    
    // First, get all courses
    console.log('Getting all courses before clearing...')
    const coursesBefore = await zoomiesDB.getAllCourses()
    console.log(`Found ${coursesBefore.length} courses before clearing:`)
    coursesBefore.forEach(course => {
      console.log(`  - ${course.title} (${course._id})`)
    })
    
    // Clear all courses
    console.log('\nClearing all courses...')
    await zoomiesDB.clearAllCourses()
    
    // Check courses after clearing
    console.log('\nGetting all courses after clearing...')
    const coursesAfter = await zoomiesDB.getAllCourses()
    console.log(`Found ${coursesAfter.length} courses after clearing:`)
    coursesAfter.forEach(course => {
      console.log(`  - ${course.title} (${course._id})`)
    })
    
    if (coursesAfter.length === 0) {
      console.log('✅ clearAllCourses test PASSED - All courses were successfully deleted')
    } else {
      console.log('❌ clearAllCourses test FAILED - Some courses still exist')
    }
    
  } catch (error) {
    console.error('❌ clearAllCourses test FAILED with error:', error)
  }
}

testClearCourses()
