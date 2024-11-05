import { createTables } from '@/app/db/utils'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await createTables()
    return NextResponse.json({ 
      message: 'Database tables created successfully',
      result: {
        createLeadsTable: result.createLeadsTable,
        createCommentsTable: result.createCommentsTable,
        createFollowUpsTable: result.createFollowUpsTable,
        createActivitiesTable: result.createActivitiesTable,
        createUpdateTrigger: result.createUpdateTrigger
      }
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}