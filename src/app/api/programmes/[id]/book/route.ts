import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { store } from '@/lib/store';
import { getUserRole, isAdminRole } from '@/lib/auth/roles';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programmeId } = await params;
    
    // 1. Fetch programme from Supabase
    const supabase = await createClient();
    const { data: programme } = await supabase
      .from('programmes')
      .select('*')
      .eq('id', programmeId)
      .single();

    if (!programme || !programme.book) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No companion book found for this programme.' },
        { status: 404 }
      );
    }

    const book = programme.book;
    const download = request.nextUrl.searchParams.get('download') === '1';

    // 2. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isAuthorized = false;
    let authReason = '';

    if (user) {
      // 2A. Check Admin privilege
      const role = await getUserRole(user, supabase);
      if (isAdminRole(role)) {
        isAuthorized = true;
        authReason = 'ADMIN';
      } else {
        // 2B. Check database entitlements
        try {
          const { data: dbEntitlement } = await supabase
            .from('entitlements')
            .select('*')
            .eq('customer_id', user.id)
            .eq('service_id', programme.service_id)
            .eq('status', 'ACTIVE')
            .maybeSingle();

          if (dbEntitlement) {
            isAuthorized = true;
            authReason = 'ACTIVE_DATABASE_ENTITLEMENT';
          }
        } catch {
          // Fallback to store entitlement
        }

        // 2C. Check store entitlement
        if (!isAuthorized && store.hasActiveEntitlement(user.id, programme.service_id)) {
          isAuthorized = true;
          authReason = 'STORE_ENTITLEMENT';
        }
      }
    } else {
      // Check for demo environment / local customer
      const clientDemoId = request.headers.get('x-demo-customer') || 'cust-demo-01';
      if (store.hasActiveEntitlement(clientDemoId, programme.service_id)) {
        isAuthorized = true;
        authReason = 'DEMO_ENTITLEMENT';
      }
    }

    // 3. Deny access if not acquired
    if (!isAuthorized) {
      return NextResponse.json(
        {
          error: 'PAYMENT_REQUIRED',
          message: 'Access Denied: You must acquire the Guided Digital Coaching Programme to unlock and download this companion book.',
          programme_id: programme.id,
          service_id: programme.service_id,
          checkout_url: `/checkout/${programme.service_id}`,
          book_preview: {
            title: book.title,
            author: book.author,
            description: book.description,
            page_count: book.page_count,
            file_size: book.file_size,
            file_type: book.file_type,
            cover_image_url: book.cover_image_url
          }
        },
        { status: 403 }
      );
    }

    // 4. If request is asking for JSON metadata / authorized check
    const acceptHeader = request.headers.get('accept') || '';
    if (!download && acceptHeader.includes('application/json')) {
      return NextResponse.json({
        authorized: true,
        auth_reason: authReason,
        book: {
          ...book,
          download_url: `/api/programmes/${programme.id}/book?download=1`
        }
      });
    }

    // 5. Serve the book file or generated workbook document
    // If the book file_url is a URL or relative path, redirect to it
    if (book.file_url && (book.file_url.startsWith('http://') || book.file_url.startsWith('https://') || book.file_url.startsWith('/'))) {
      return NextResponse.redirect(
        book.file_url.startsWith('/') 
          ? new URL(book.file_url, request.url) 
          : book.file_url
      );
    }

    // Generate a dedicated formatted text/PDF stream for the companion workbook
    const workbookContent = `================================================================================
BECOMING HER — OFFICIAL DIGITAL PROGRAMME COMPANION WORKBOOK
${book.title.toUpperCase()}
Author: ${book.author || 'Lead Coach Zipporah Karanja'}
Programme: ${programme.title}
Version: 2026 Edition • Personal Copy
================================================================================

WELCOME TO YOUR SACRED TRANSFORMATION JOURNAL

"You are not here to build a replica of who you were taught to be.
 You are here to remember who you were before the world told you who to become."
                                        — Lead Coach Zipporah Karanja

--------------------------------------------------------------------------------
TABLE OF CONTENTS & REFLECTION ARCHITECTURE
--------------------------------------------------------------------------------
STAGE 1: THE AWAKENING & UNLEARNING
  • Lesson 1.1: Intentional Foundations & Self-Compassion
  • Lesson 1.2: Deconstructing Limiting Scripts & Inherited Narratives
  • Lesson 1.3: The Power of Emotional Boundaries

STAGE 2: CORE IDENTITY & SELF-CONCEPT
  • Lesson 2.1: Clarifying Your 5 Non-Negotiable Values
  • Lesson 2.2: The Identity Shift: Embodying Her Today

STAGE 3: PURPOSE, VISION & DAILY RITUALS
  • Lesson 3.1: Designing Sacred Morning & Evening Architecture
  • Lesson 3.2: Audacious Goals with Gentle Execution

STAGE 4: INTEGRATION, ELEVATION & SOVEREIGNTY
  • Lesson 4.1: Navigating Triggers & Old Relapses with Grace
  • Lesson 4.2: Your Becoming Her Living Manifesto

--------------------------------------------------------------------------------
WEEKLY PROMPT & SOMATIC EXERCISES INCLUDED:
1. What belief about yourself have you outgrown, yet still find yourself subconsciously carrying?
2. Where in your life are you over-functioning or people-pleasing at the expense of your peace?
3. How would you describe the woman you are becoming in five vivid adjectives?
4. What is one bold desire you have whispered in secret that you are now ready to declare out loud?
5. What promise will you make to yourself today as you complete this sacred chapter?

--------------------------------------------------------------------------------
(C) 2026 Becoming Her. All Rights Reserved. Confidential to Registered Member.
================================================================================`;

    return new NextResponse(workbookContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${book.file_name.replace(/\.[^/.]+$/, '')}.txt"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (err: any) {
    console.error('[PROGRAMME_BOOK_API_ERROR]', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
