import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    return NextResponse.json({ success: true, message: 'Signed out successfully' })
  } catch (error: any) {
    console.error('Error signing out on server:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to sign out' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    return NextResponse.redirect(new URL('/login?message=' + encodeURIComponent('You have been safely signed out. Please sign in to access your Customer Portal.'), request.url))
  } catch (error: any) {
    console.error('Error signing out on server GET:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
