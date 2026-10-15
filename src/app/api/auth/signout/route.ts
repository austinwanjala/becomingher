import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const res = NextResponse.json({ success: true, message: 'Signed out successfully' })

    // Explicitly delete any supabase or auth related cookies on the response
    for (const c of allCookies) {
      if (c.name.startsWith('sb-') || c.name.includes('auth-token') || c.name.includes('supabase')) {
        res.cookies.set(c.name, '', { maxAge: 0, path: '/', expires: new Date(0) })
      }
    }

    revalidatePath('/', 'layout')
    return res
  } catch (error: any) {
    console.error('Error signing out on server:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to sign out' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const res = NextResponse.redirect(new URL('/login', request.url))

    for (const c of allCookies) {
      if (c.name.startsWith('sb-') || c.name.includes('auth-token') || c.name.includes('supabase')) {
        res.cookies.set(c.name, '', { maxAge: 0, path: '/', expires: new Date(0) })
      }
    }

    revalidatePath('/', 'layout')
    return res
  } catch (error: any) {
    console.error('Error signing out on server GET:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
