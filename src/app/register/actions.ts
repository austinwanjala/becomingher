'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { CURRENT_DISCLAIMER_VERSION } from '@/lib/disclaimer'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const disclaimerAccepted = 
    formData.get('disclaimer_accepted') === 'true' || 
    formData.get('disclaimer_accepted') === 'on' ||
    formData.get('disclaimer_checkbox_ui') === 'on'
  const rawTarget = (formData.get('redirect') as string) || '/dashboard'
  const redirectTarget = rawTarget.startsWith('/admin') ? '/dashboard' : rawTarget

  if (!disclaimerAccepted) {
    redirect(`/register?message=${encodeURIComponent('Please accept the Becoming Her personal development and coaching disclaimer to proceed.')}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  if (!email || !password) {
    redirect(`/register?message=${encodeURIComponent('Please provide both email and password.')}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  if (password.length < 6) {
    redirect(`/register?message=${encodeURIComponent('Password must be at least 6 characters long.')}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  // Extract client metadata safely
  let clientIp = 'unknown';
  let userAgent = 'unknown';
  try {
    const headerList = await headers();
    clientIp = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown';
    userAgent = headerList.get('user-agent') || 'unknown';
  } catch (err) {
    console.warn('Headers unavailable during signup metadata extraction:', err);
  }

  const acceptedAt = new Date().toISOString();

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || 'Beloved Member',
        phone: phone || '',
        registered_via: 'customer',
        disclaimer_version: CURRENT_DISCLAIMER_VERSION,
        disclaimer_accepted: true,
        disclaimer_accepted_at: acceptedAt,
        disclaimer_ip: clientIp,
        disclaimer_user_agent: userAgent
      }
    }
  })

  if (!error && authData.user) {
    // Record disclaimer acceptance into store compliance log
    import('@/lib/store').then(async ({ store }) => {
      store.recordDisclaimerAcceptance({
        userId: authData.user!.id,
        userEmail: email,
        disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
        context: 'REGISTRATION',
        ipAddress: clientIp,
        userAgent: userAgent
      });

      if (phone) {
        await store.linkWhatsAppContactToUser(phone, authData.user!.id);
      }
    }).catch(console.error);
  }

  if (error) {
    console.error('Supabase signup error:', error)
    let userMsg = error.message
    if (error.message.includes('rate limit') || error.status === 429) {
      userMsg = 'Email confirmation limit reached on Supabase. In your Supabase Dashboard under Authentication -> Providers -> Email, please turn OFF "Confirm email" to enable instant member registrations.'
    } else if (error.message.includes('invalid') && error.message.toLowerCase().includes('email')) {
      userMsg = 'Please enter a standard valid email address (e.g., using @gmail.com or @yahoo.com). Test domains like @example.com are blocked by Supabase.'
    }
    redirect(`/register?message=${encodeURIComponent(userMsg)}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  // If email confirmation is required by Supabase settings, session will be null
  if (!authData.session) {
    redirect(`/login?message=${encodeURIComponent('Account registered! If email confirmation is enabled in your Supabase project, please check your inbox to confirm, or turn off "Confirm email" in Supabase settings for instant login.')}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTarget)
}
