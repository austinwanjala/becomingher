/**
 * Becoming Her - Service PDF & Order Fulfillment Email Delivery Engine
 *
 * Automatically dispatches official service PDFs, workbooks, and curriculum guides
 * to customers upon successful checkout and payment verification.
 */

import { store } from '@/lib/store';
import { SHORT_DISCLAIMER } from '@/lib/disclaimer';

export interface SendServicePdfEmailParams {
  customerEmail: string;
  customerName: string;
  serviceId: string;
  serviceTitle: string;
  orderReference: string;
  pdfUrl?: string;
  pdfName?: string;
  pdfTitle?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  provider: 'RESEND' | 'SIMULATED' | 'ERROR';
  message: string;
  pdfUrl?: string;
  pdfName?: string;
  timestamp: string;
}

/**
 * Resolves the appropriate PDF asset for a given service.
 * Checks service-specific PDF attachments first, then falls back to programme companion book.
 */
export function resolveServicePdf(serviceId: string): { url: string; name: string; title: string } | null {
  const service = store.getServiceById(serviceId);
  
  if (service?.pdf_url) {
    return {
      url: service.pdf_url,
      name: service.pdf_name || `${service.slug}-materials.pdf`,
      title: service.pdf_title || `${service.name} Materials`
    };
  }

  // Fallback to Programme Book if it's the digital programme or has an active book
  if (store.programme?.book?.file_url) {
    return {
      url: store.programme.book.file_url,
      name: store.programme.book.file_name || 'becoming-her-companion-workbook.pdf',
      title: store.programme.book.title || 'Becoming Her Sacred Companion Workbook'
    };
  }

  // Default platform fallback workbook
  return {
    url: '/materials/becoming-her-companion-workbook.pdf',
    name: 'becoming-her-companion-workbook.pdf',
    title: 'Becoming Her Sacred Companion Workbook & Reflective Manifesto'
  };
}

/**
 * Generates an elegant, brand-aligned HTML email template for PDF fulfillment.
 */
function buildServicePdfEmailHtml({
  customerName,
  serviceTitle,
  orderReference,
  pdfTitle,
  pdfName,
  downloadUrl
}: {
  customerName: string;
  serviceTitle: string;
  orderReference: string;
  pdfTitle: string;
  pdfName: string;
  downloadUrl: string;
}) {
  const brandName = store.brand?.name || 'Becoming Her';
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${brandName} Materials</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px border #e7e5e4; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1c1917 0%, #4c0519 50%, #1c1917 100%); padding: 36px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #fef3c7; font-weight: 600;">
                Digital Sanctuary & Coaching
              </p>
              <h1 style="margin: 8px 0 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal; color: #ffffff; letter-spacing: 0.5px;">
                ${brandName}
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="margin: 0 0 16px; font-size: 18px; font-family: Georgia, serif; color: #4c0519;">
                Welcome into your elevation, beloved ${customerName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 14px; color: #44403c; line-height: 1.7;">
                Thank you for honoring yourself and taking this deliberate step forward. Your order for <strong>${serviceTitle}</strong> has been successfully confirmed (Order Reference: <strong style="font-family: monospace; color: #1c1917;">${orderReference}</strong>).
              </p>

              <!-- PDF Resource Delivery Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; border: 1px solid #e7e5e4; border-radius: 16px; margin: 24px 0; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #881337; font-weight: 700;">
                      Included Service Material (PDF)
                    </p>
                    <h3 style="margin: 0 0 8px; font-family: Georgia, serif; font-size: 17px; color: #1c1917;">
                      ${pdfTitle}
                    </h3>
                    <p style="margin: 0 0 16px; font-size: 12px; color: #78716c;">
                      File: <strong>${pdfName}</strong> &bull; Accessible instantly for offline reading and reflection.
                    </p>
                    
                    <a href="${downloadUrl}" target="_blank" style="display: inline-block; background-color: #1c1917; color: #fef3c7; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 600; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      📥 Download Your PDF Materials &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Member Portal Access -->
              <h4 style="margin: 28px 0 8px; font-size: 14px; font-weight: 600; color: #1c1917;">
                Next Steps in Your Sanctuary:
              </h4>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 13px; color: #57534e; line-height: 1.8;">
                <li>Sign in to your <a href="https://becomingher.co.ke/dashboard" style="color: #881337; text-decoration: underline; font-weight: 500;">Member Dashboard</a> to view your active modules.</li>
                <li>Complete your personal reflection inquiries and track your growth milestones.</li>
                <li>Engage with your personal Sanctuary Growth Companion for continuous guidance.</li>
              </ul>

              <p style="margin: 0; font-size: 13px; color: #57534e;">
                With highest grace and belief in who you are becoming,<br>
                <strong style="color: #1c1917;">Lead Coach Zipporah Karanja & The Becoming Her Team</strong>
              </p>
            </td>
          </tr>

          <!-- Legal Disclaimer Footer -->
          <tr>
            <td style="background-color: #f5f5f4; border-top: 1px solid #e7e5e4; padding: 24px 32px; font-size: 11px; color: #78716c; line-height: 1.6;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #44403c;">
                Official Coaching & Sanctuary Guardrail Notice:
              </p>
              <p style="margin: 0 0 12px;">
                ${SHORT_DISCLAIMER}
              </p>
              <p style="margin: 0; color: #a8a29e;">
                &copy; ${currentYear} ${brandName}. All rights reserved. &bull; <a href="https://becomingher.co.ke/disclaimer" style="color: #78716c; text-decoration: underline;">Read Full Disclaimer</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends service PDFs and materials to the customer via Resend REST API,
 * with graceful fallback to audit simulation when API keys are not yet provided.
 */
export async function sendServicePdfEmail(params: SendServicePdfEmailParams): Promise<EmailDeliveryResult> {
  const { customerEmail, customerName, serviceId, serviceTitle, orderReference } = params;

  // Resolve PDF asset for the service
  const pdfAsset = params.pdfUrl
    ? {
        url: params.pdfUrl,
        name: params.pdfName || 'service-materials.pdf',
        title: params.pdfTitle || `${serviceTitle} Materials`
      }
    : resolveServicePdf(serviceId);

  const finalPdf = pdfAsset || {
    url: '/materials/becoming-her-companion-workbook.pdf',
    name: 'becoming-her-companion-workbook.pdf',
    title: 'Becoming Her Sacred Companion Workbook'
  };

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'Becoming Her <onboarding@resend.dev>';
  const subject = `✨ Your Becoming Her Materials: ${serviceTitle} (${orderReference})`;

  // Ensure download URL is absolute if provided as relative path
  let downloadUrl = finalPdf.url;
  if (downloadUrl.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://becomingher.co.ke';
    downloadUrl = `${baseUrl}${downloadUrl}`;
  }

  const htmlContent = buildServicePdfEmailHtml({
    customerName,
    serviceTitle,
    orderReference,
    pdfTitle: finalPdf.title,
    pdfName: finalPdf.name,
    downloadUrl
  });

  // 1. If RESEND_API_KEY is available, dispatch via Resend REST API
  if (resendApiKey) {
    try {
      const emailPayload: any = {
        from: emailFrom,
        to: [customerEmail],
        subject: subject,
        html: htmlContent
      };

      // If PDF URL is a public web link, attach it or let them download via link
      if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
        emailPayload.attachments = [
          {
            filename: finalPdf.name,
            path: downloadUrl
          }
        ];
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Resend email dispatch error');
      }

      store.addAuditLog(
        'EMAIL_SENT_RESEND',
        'EMAIL',
        `Service PDF "${finalPdf.name}" sent to ${customerEmail} for Order ${orderReference} via Resend (ID: ${data.id})`
      );

      return {
        success: true,
        provider: 'RESEND',
        message: `Email successfully dispatched to ${customerEmail} via Resend.`,
        pdfUrl: downloadUrl,
        pdfName: finalPdf.name,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error('Error sending email via Resend:', err);
      store.addAuditLog(
        'EMAIL_SEND_FAILED',
        'EMAIL',
        `Failed to send email to ${customerEmail}: ${err.message}`
      );
    }
  }

  // 2. Fallback simulation (when RESEND_API_KEY is not yet configured in .env)
  store.addAuditLog(
    'EMAIL_SIMULATED_PENDING_CONFIG',
    'EMAIL',
    `Simulated PDF email dispatch for Order ${orderReference} to ${customerEmail} (PDF: "${finalPdf.name}"). To send live emails, set RESEND_API_KEY in .env.local and Vercel.`
  );

  return {
    success: true,
    provider: 'SIMULATED',
    message: `PDF fulfillment email prepared for ${customerEmail}. To deliver live emails, configure RESEND_API_KEY in your environment.`,
    pdfUrl: downloadUrl,
    pdfName: finalPdf.name,
    timestamp: new Date().toISOString()
  };
}
