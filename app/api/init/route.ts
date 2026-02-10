import { createTables } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyRequestAuth } from '@/lib/auth'

export async function POST(request: Request) {
  const decoded = verifyRequestAuth(request)
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await createTables()
    return NextResponse.json({
      message: 'Database tables created successfully',
      result: {
        createLeadsTable: result.createLeadsTable,
        createCommentsTable: result.createCommentsTable,
        createFollowUpsTable: result.createFollowUpsTable,
        createActivitiesTable: result.createActivitiesTable,
        createUsersTable: result.createUsersTable,
        createVerificationCodesTable: result.createVerificationCodesTable,
        createUpdateTrigger: result.createUpdateTrigger,
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
