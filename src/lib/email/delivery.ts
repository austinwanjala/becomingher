/**
 * Becoming Her - Service PDF & Order Fulfillment Email Delivery Engine
 *
 * Automatically dispatches official service PDFs, workbooks, and curriculum guides
 * to customers upon successful checkout and payment verification.
 */

import { store } from '@/lib/store';
import { SHORT_DISCLAIMER } from '@/lib/disclaimer';
import { ServiceResource } from '@/types';
import { getServiceById } from '@/lib/services';
import { createAdminClient } from '@/utils/supabase/server';

export interface SendServicePdfEmailParams {
  customerEmail: string;
  customerName: string;
  serviceId: string;
  serviceTitle: string;
  orderReference: string;
  pdfUrl?: string;
  pdfName?: string;
  pdfTitle?: string;
  questionnaireUrl?: string;
  resources?: ServiceResource[];
  booking?: {
    scheduledDate: string;
    startTime: string;
    meetingLink: string;
    coachName?: string;
    isResend?: boolean;
    isUpdatedLink?: boolean;
  };
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
export async function resolveServicePdf(serviceId: string): Promise<{ url: string; name: string; title: string } | null> {
  const service = await getServiceById(serviceId);
  
  if (service?.pdf_url && !service.pdf_url.includes('becoming-her-companion-workbook.pdf') && !service.pdf_url.includes('new-service-materials.pdf')) {
    return {
      url: service.pdf_url,
      name: service.pdf_name || `${service.slug}-materials.pdf`,
      title: service.pdf_title || `${service.name} Materials`
    };
  }

  return null;
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
  downloadUrl,
  resources,
  booking,
  isCustomizedService,
  questionnaireUrl,
  dashboardUploadUrl
}: {
  customerName: string;
  serviceTitle: string;
  orderReference: string;
  pdfTitle?: string;
  pdfName?: string;
  downloadUrl?: string;
  resources?: ServiceResource[];
  booking?: {
    scheduledDate: string;
    startTime: string;
    meetingLink: string;
    coachName?: string;
    isResend?: boolean;
    isUpdatedLink?: boolean;
  };
  isCustomizedService?: boolean;
  questionnaireUrl?: string;
  dashboardUploadUrl?: string;
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

              ${booking ? `
              <div style="background-color: #fdf2f8; border: 2px solid ${booking.isUpdatedLink || booking.isResend ? '#059669' : '#fbcfe8'}; border-radius: 16px; padding: 26px; margin: 28px 0; box-shadow: 0 4px 14px ${booking.isUpdatedLink || booking.isResend ? 'rgba(5, 150, 105, 0.12)' : 'rgba(0, 0, 0, 0.04)'};">
                
                ${booking.isUpdatedLink || booking.isResend ? `
                <!-- Prominent Updated Link Alert Callout -->
                <div style="background-color: #ecfdf5; border: 1.5px solid #10b981; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
                  <span style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 9999px;">
                    🔔 Updated Video Meeting Link
                  </span>
                  <p style="margin: 10px 0 0; font-size: 13px; color: #065f46; line-height: 1.5; font-weight: 600;">
                    Your coaching session video meeting link has been updated. Please connect to your upcoming 1-on-1 session with Lead Coach Zipporah using the new link highlighted below.
                  </p>
                </div>
                ` : ''}

                <h3 style="margin-top: 0; margin-bottom: 16px; color: #831843; font-size: 19px; font-weight: 700; font-family: Georgia, serif;">
                  ${booking.isUpdatedLink || booking.isResend ? 'Your Session Schedule & Updated Meeting Link' : 'Your Upcoming Session'}
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fbcfe8; color: #831843; font-weight: 600; width: 140px; font-size: 13px;">Date &amp; Time</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fbcfe8; color: #4c0519; font-size: 13px; font-weight: 500;">${booking.scheduledDate} at ${booking.startTime}</td>
                  </tr>
                  ${booking.coachName ? `
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fbcfe8; color: #831843; font-weight: 600; font-size: 13px;">Lead Coach</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #fbcfe8; color: #4c0519; font-size: 13px;">${booking.coachName}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0 8px; color: #831843; font-weight: 600; font-size: 13px; vertical-align: top;">
                      ${booking.isUpdatedLink || booking.isResend ? 'Updated Meeting Link' : 'Meeting Link'}
                    </td>
                    <td style="padding: 12px 0 8px;">
                      ${booking.isUpdatedLink || booking.isResend ? `
                      <div style="background-color: #ffffff; border: 2px solid #059669; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.08);">
                        <span style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 4px;">
                          ✅ Current Active Link:
                        </span>
                        <a href="${booking.meetingLink}" target="_blank" style="color: #047857; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-size: 14px; font-weight: bold; text-decoration: underline; word-break: break-all;">
                          ${booking.meetingLink}
                        </a>
                      </div>
                      ` : `
                      <a href="${booking.meetingLink}" target="_blank" style="color: #9f1239; font-family: monospace; font-size: 13px; text-decoration: underline; word-break: break-all;">
                        ${booking.meetingLink}
                      </a>
                      `}
                    </td>
                  </tr>
                </table>

                <!-- Call to Action Button -->
                <div style="margin: 16px 0 10px;">
                  <a href="${booking.meetingLink}" target="_blank" style="display: inline-block; background-color: ${booking.isUpdatedLink || booking.isResend ? '#059669' : '#9f1239'}; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 12px; font-size: 13px; font-weight: 700; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                    🎥 ${booking.isUpdatedLink || booking.isResend ? 'Join Session with Updated Link &rarr;' : 'Join Video Call &rarr;'}
                  </a>
                </div>

                <p style="margin-top: 12px; margin-bottom: 0; font-size: 12px; color: #831843; opacity: 0.85;">
                  Please ensure you are in a quiet, private space at the time of our session. You can join directly from your browser or mobile phone.
                </p>
              </div>
              ` : ''}

              ${isCustomizedService && questionnaireUrl ? `
              <!-- Required Assessment Questionnaire Notice for Customized Coaching -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff1f2; border: 2px solid #fda4af; border-radius: 16px; margin: 24px 0; padding: 22px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px;">
                      <span style="display: inline-block; background-color: #9f1239; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 9999px;">
                        Action Required: Onboarding Assessment
                      </span>
                    </p>
                    <h3 style="margin: 6px 0 10px; font-family: Georgia, serif; font-size: 18px; color: #881337;">
                      Personalized Life Assessment Questionnaire
                    </h3>
                    <p style="margin: 0 0 12px; font-size: 13px; color: #4c0519; line-height: 1.6;">
                      Because you have enrolled in the <strong>${serviceTitle}</strong>, your entire coaching journey is uniquely tailored to you. Lead Coach Zipporah crafts your personalized reflections, curriculum, and milestones based directly on your life assessment responses.
                    </p>
                    <div style="background-color: #ffffff; border-left: 4px solid #be185d; border-radius: 8px; padding: 14px 16px; margin: 14px 0;">
                      <p style="margin: 0; font-size: 13px; color: #831843; font-weight: 600; line-height: 1.6;">
                        📝 <strong>Next Step:</strong> Please download the questionnaire template below, fill it in thoroughly with your personal reflections and goals, and <strong>reupload the completed file</strong> to your Member Dashboard so Lead Coach Zipporah can formulate your tailored roadmap.
                      </p>
                    </div>
                    <table cellpadding="0" cellspacing="0" style="margin-top: 14px;">
                      <tr>
                        <td style="padding-right: 10px; padding-bottom: 8px;">
                          <a href="${questionnaireUrl}" target="_blank" style="display: inline-block; background-color: #9f1239; color: #ffffff; text-decoration: none; padding: 11px 20px; border-radius: 10px; font-size: 12px; font-weight: 600; text-align: center; box-shadow: 0 2px 6px rgba(159, 18, 57, 0.25);">
                            📥 Download Questionnaire Template
                          </a>
                        </td>
                        <td style="padding-bottom: 8px;">
                          <a href="${dashboardUploadUrl || 'https://becomingher.co.ke/dashboard'}" target="_blank" style="display: inline-block; background-color: #ffffff; border: 1.5px solid #9f1239; color: #9f1239; text-decoration: none; padding: 10px 18px; border-radius: 10px; font-size: 12px; font-weight: 600; text-align: center;">
                            📤 Reupload Completed File &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 10px 0 0; font-size: 11px; color: #9f1239; opacity: 0.9; font-style: italic;">
                      Once uploaded to your dashboard, Lead Coach Zipporah will review your responses and personalize your curriculum modules.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${downloadUrl ? `
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
              ` : ''}

              ${resources && resources.length > 0 ? `
              <!-- Additional Resources -->
              <h4 style="margin: 28px 0 8px; font-size: 14px; font-weight: 600; color: #1c1917;">
                Additional Included Resources:
              </h4>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                ${resources.map(res => `
                <tr>
                  <td style="padding: 16px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #ffffff; display: block; margin-bottom: 12px;">
                    <p style="margin: 0 0 4px; font-family: Georgia, serif; font-size: 15px; color: #1c1917; font-weight: bold;">
                      ${res.title}
                    </p>
                    <p style="margin: 0 0 12px; font-size: 12px; color: #78716c;">
                      File: <strong>${res.file_name}</strong> &bull; ${res.file_size || 'Accessible instantly'}
                    </p>
                    <a href="${res.file_url}" target="_blank" style="display: inline-block; background-color: #f43f5e; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center;">
                      ⬇ Download File
                    </a>
                  </td>
                </tr>
                `).join('')}
              </table>
              ` : ''}

              <!-- Member Portal Access -->
              <h4 style="margin: 28px 0 8px; font-size: 14px; font-weight: 600; color: #1c1917;">
                Next Steps in Your Sanctuary:
              </h4>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 13px; color: #57534e; line-height: 1.8;">
                ${isCustomizedService && questionnaireUrl ? `
                <li><strong style="color: #9f1239;">Fill In &amp; Reupload Questionnaire:</strong> Download the assessment questionnaire above, complete it thoroughly, and <a href="${dashboardUploadUrl || 'https://becomingher.co.ke/dashboard'}" style="color: #9f1239; font-weight: 600; text-decoration: underline;">reupload it in your Member Dashboard</a>.</li>
                ` : ''}
                <li>Sign in to your <a href="${dashboardUploadUrl || 'https://becomingher.co.ke/dashboard'}" style="color: #881337; text-decoration: underline; font-weight: 500;">Member Dashboard</a> to view your active modules.</li>
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

  // Fetch full service object to get latest resources from DB or store
  const service = (await getServiceById(serviceId)) || store.services.find(s => s.id === serviceId || s.slug === serviceId);
  const allResources = params.resources || service?.resources || [];

  // Determine if this is the customized coaching service
  const isCustomizedService =
    serviceId === 'srv-custom-02' ||
    service?.id === 'srv-custom-02' ||
    service?.slug === 'custom-coaching' ||
    service?.type === 'CUSTOM_COACHING' ||
    serviceTitle.toLowerCase().includes('custom') ||
    Boolean(service?.name && service.name.toLowerCase().includes('custom'));

  // Resolve questionnaire URL if it exists
  let questionnaireUrl =
    params.questionnaireUrl ||
    service?.questionnaire_template_url ||
    service?.questionnaire_url ||
    (isCustomizedService ? 'https://ssspngdzadgjehinospw.supabase.co/storage/v1/object/public/materials/questionnaires/1789587626505-1b5ozx.docx' : undefined);

  // Resolve PDF asset for the service
  const pdfAsset = params.pdfUrl
    ? {
        url: params.pdfUrl,
        name: params.pdfName || 'service-materials.pdf',
        title: params.pdfTitle || `${serviceTitle} Materials`
      }
    : await resolveServicePdf(serviceId);

  const finalPdf = pdfAsset;

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'Becoming Her <onboarding@resend.dev>';

  // Ensure base URL is correctly formatted
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'https://becomingher-five.vercel.app';
  
  // Fix common misconfiguration where NEXT_PUBLIC_APP_URL is left as localhost in production
  if (baseUrl.includes('localhost') && process.env.VERCEL) {
    baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'becomingher-five.vercel.app';
  }
  
  // Ensure protocol exists
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  // Remove trailing slash if any
  baseUrl = baseUrl.replace(/\/$/, '');

  let downloadUrl = finalPdf?.url;
  if (downloadUrl && downloadUrl.startsWith('/')) {
    downloadUrl = `${baseUrl}${downloadUrl}`;
  }

  // Ensure questionnaire URL is absolute if provided as relative path
  if (questionnaireUrl && questionnaireUrl.startsWith('/')) {
    questionnaireUrl = `${baseUrl}${questionnaireUrl}`;
  }

  const dashboardUploadUrl = `${baseUrl}/dashboard/programmes/${service?.id || 'srv-custom-02'}`;

  let subject = (isCustomizedService && questionnaireUrl)
    ? `✨ Action Required: Complete & Reupload Your Questionnaire - ${serviceTitle} (${orderReference})`
    : `✨ Your Becoming Her Materials: ${serviceTitle} (${orderReference})`;

  if (params.booking?.isUpdatedLink || params.booking?.isResend) {
    subject = `🔔 Updated Meeting Link: Your 1-on-1 Session with Coach Zipporah (${orderReference})`;
  }

  const htmlContent = buildServicePdfEmailHtml({
    customerName,
    serviceTitle,
    orderReference,
    pdfTitle: finalPdf?.title,
    pdfName: finalPdf?.name,
    downloadUrl,
    resources: allResources,
    booking: params.booking,
    isCustomizedService,
    questionnaireUrl,
    dashboardUploadUrl
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

      // If PDF URL is a public web link (and not localhost), attach it directly
      if (downloadUrl && typeof downloadUrl === 'string' && (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) && !downloadUrl.includes('localhost')) {
        emailPayload.attachments = [
          {
            filename: finalPdf?.name || 'materials.pdf',
            path: downloadUrl
          }
        ];
      }

      // If customized service questionnaire template is available as a web link, also attach it
      if (isCustomizedService && questionnaireUrl && typeof questionnaireUrl === 'string' && (questionnaireUrl.startsWith('http://') || questionnaireUrl.startsWith('https://')) && !questionnaireUrl.includes('localhost')) {
        if (!emailPayload.attachments) emailPayload.attachments = [];
        emailPayload.attachments.push({
          filename: 'Becoming-Her-Coaching-Assessment-Questionnaire.docx',
          path: questionnaireUrl
        });
      }

      // Also attach additional resources if they are valid URLs
      if (allResources && allResources.length > 0) {
        if (!emailPayload.attachments) emailPayload.attachments = [];
        allResources.forEach(res => {
          if (res && res.file_url && typeof res.file_url === 'string' && (res.file_url.startsWith('http://') || res.file_url.startsWith('https://')) && !res.file_url.includes('localhost')) {
            emailPayload.attachments.push({
              filename: res.file_name || 'attachment',
              path: res.file_url
            });
          }
        });
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
        `Service PDF "${finalPdf?.name || 'Materials'}" sent to ${customerEmail} for Order ${orderReference} via Resend (ID: ${data.id})`
      );

      return {
        success: true,
        provider: 'RESEND',
        message: `Email successfully dispatched to ${customerEmail} via Resend.`,
        pdfUrl: downloadUrl,
        pdfName: finalPdf?.name,
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
    `Simulated PDF email dispatch for Order ${orderReference} to ${customerEmail} (PDF: "${finalPdf?.name || 'Materials'}"). To send live emails, set RESEND_API_KEY in .env.local and Vercel.`
  );

  return {
    success: true,
    provider: 'SIMULATED',
    message: `PDF fulfillment email prepared for ${customerEmail}. To deliver live emails, configure RESEND_API_KEY in your environment.`,
    pdfUrl: downloadUrl,
    pdfName: finalPdf?.name,
    timestamp: new Date().toISOString()
  };
}

/**
 * Sends a luxury, branded Becoming Her password reset email with the recovery link.
 */
export async function sendPasswordResetEmail({
  email,
  resetLink,
  recipientName
}: {
  email: string;
  resetLink: string;
  recipientName?: string;
}): Promise<EmailDeliveryResult> {
  const brandName = store.brand?.name || 'Becoming Her';
  const name = recipientName || email.split('@')[0];
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  const currentYear = new Date().getFullYear();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your ${brandName} Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1c1917 0%, #4c0519 50%, #1c1917 100%); padding: 36px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #fef3c7; font-weight: 600;">
                Personal Development & Coaching Sanctuary
              </p>
              <h1 style="margin: 8px 0 0; font-family: Georgia, serif; font-size: 28px; font-weight: normal; color: #ffffff; letter-spacing: 0.5px;">
                ${brandName}
              </h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 22px; font-weight: 600; color: #1c1917;">
                Password Reset Request
              </h2>
              
              <p style="margin: 0 0 16px; font-size: 14px; color: #44403c;">
                Hello <strong>${capitalizedName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; font-size: 14px; color: #57534e; line-height: 1.7;">
                We received a request to reset the password for your Becoming Her sanctuary account. Click the button below to establish a new password and resume your journey.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #4c0519 0%, #1c1917 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 14px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(76, 5, 25, 0.25);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 12px; color: #78716c; line-height: 1.6;">
                For your security, this password reset link is temporary and will expire in 1 hour.
              </p>

              <p style="margin: 0 0 20px; font-size: 12px; color: #a8a29e; word-break: break-all;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="${resetLink}" style="color: #881337; text-decoration: underline;">${resetLink}</a>
              </p>

              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f5f5f4;">
                <p style="margin: 0; font-size: 12px; color: #78716c;">
                  If you did not request this password reset, please disregard this email. Your password and account remain completely secure.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 24px 32px; border-top: 1px solid #f5f5f4; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #78716c;">
                © ${currentYear} ${brandName}. Dedicated to sovereign transformation & coaching mastery.
              </p>
              <p style="margin: 0; font-size: 10px; color: #a8a29e;">
                Nairobi, Kenya • All rights reserved
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

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'Becoming Her <onboarding@resend.dev>';

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [email],
          subject: `✨ Reset Your Becoming Her Password`,
          html: htmlContent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Resend reset email error');
      }

      store.addAuditLog('PASSWORD_RESET_EMAIL_SENT', 'AUTH', `Password reset email dispatched to ${email}`);
      return {
        success: true,
        provider: 'RESEND',
        message: `Password reset email sent to ${email}`,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error('Error dispatching password reset via Resend:', err);
    }
  }

  return {
    success: true,
    provider: 'SIMULATED',
    message: `Password reset link generated for ${email}`,
    timestamp: new Date().toISOString()
  };
}

export interface SendAdminOrderNotificationParams {
  orderReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceTitle: string;
  serviceId?: string;
  amount: number;
  currency: string;
  paymentProvider?: string;
  paymentStatus?: string;
  booking?: {
    scheduledDate: string;
    startTime: string;
    meetingLink?: string;
    coachName?: string;
  };
  isTest?: boolean;
  adminEmailOverride?: string;
}

/**
 * Sends a real-time executive alert to the configured admin email(s) whenever
 * a customer completes a purchase, payment, or enrollment.
 */
export async function sendAdminOrderNotificationEmail(
  params: SendAdminOrderNotificationParams
): Promise<EmailDeliveryResult> {
  const {
    orderReference,
    customerName,
    customerEmail,
    customerPhone,
    serviceTitle,
    amount,
    currency,
    paymentProvider = 'SELAR',
    paymentStatus = 'SUCCESSFUL',
    booking,
    isTest = false,
    adminEmailOverride
  } = params;

  const brandName = store.brand?.name || 'Becoming Her';
  const currentYear = new Date().getFullYear();

  // 1. Resolve admin notification email address(es) from override, DB site_settings, env, or fallback
  let configuredEmails = adminEmailOverride || '';
  if (!configuredEmails) {
    try {
      const adminSupabase = await createAdminClient();
      const { data: settingsData } = await adminSupabase
        .from('site_settings')
        .select('brand')
        .eq('id', 'global')
        .single();
      if (settingsData?.brand?.admin_notification_email) {
        configuredEmails = settingsData.brand.admin_notification_email;
      }
    } catch (err) {
      console.warn('Could not read admin_notification_email from site_settings:', err);
    }
  }

  if (!configuredEmails) {
    configuredEmails =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      process.env.ADMIN_EMAILS ||
      store.brand?.admin_notification_email ||
      'hello@becomingher.co.ke';
  }

  // Parse comma/semicolon/space separated emails
  const recipients = configuredEmails
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@') && e.includes('.'));

  if (recipients.length === 0) {
    recipients.push('hello@becomingher.co.ke');
  }

  // Base URL for links
  let baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    'https://becomingher-five.vercel.app';
  if (baseUrl.includes('localhost') && process.env.VERCEL) {
    baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'becomingher-five.vercel.app';
  }
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, '');

  const adminOrdersUrl = `${baseUrl}/admin/orders`;
  const adminCustomersUrl = `${baseUrl}/admin/customers`;

  const subject = `${isTest ? '[TEST ALERT] ' : ''}🎉 New Customer Enrollment: ${customerName} - ${serviceTitle} (${orderReference})`;

  const formattedAmount = `${currency} ${amount.toLocaleString()}`;
  const transactionTime = new Date().toLocaleString('en-KE', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi'
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Customer Enrollment Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4c0519 0%, #1c1917 100%); padding: 32px 28px; text-align: center;">
              <span style="display: inline-block; background-color: rgba(254, 243, 199, 0.15); border: 1px solid rgba(254, 243, 199, 0.3); color: #fef3c7; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; padding: 4px 12px; border-radius: 9999px;">
                🔔 Sanctuary Admin Notification
              </span>
              <h1 style="margin: 12px 0 4px; font-family: Georgia, serif; font-size: 24px; font-weight: normal; color: #ffffff; letter-spacing: 0.5px;">
                ${isTest ? 'Test Order & Enrollment Alert' : 'New Customer Enrollment Confirmed'}
              </h1>
              <p style="margin: 0; font-size: 12px; color: #fecdd3;">
                Order ${orderReference} &bull; Received ${transactionTime}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="margin: 0 0 20px; font-size: 14px; color: #44403c; line-height: 1.6;">
                A customer has successfully purchased and enrolled in a sanctuary offering on <strong>${brandName}</strong>. Access entitlements have been provisioned and customer fulfillment dispatched.
              </p>

              <!-- Enrollment Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf2f4; border: 1px solid #fecdd3; border-radius: 16px; margin: 0 0 24px; overflow: hidden;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #9f1239; font-weight: 700;">
                      Service / Programme Enrolled
                    </p>
                    <h3 style="margin: 0 0 8px; font-family: Georgia, serif; font-size: 18px; color: #881337;">
                      ${serviceTitle}
                    </h3>
                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1c1917;">
                      Payment Amount: <span style="color: #059669;">${formattedAmount}</span>
                      <span style="font-size: 11px; font-weight: normal; color: #78716c; margin-left: 8px;">(${paymentProvider} &bull; ${paymentStatus})</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Customer Details Card -->
              <h4 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.2px; color: #78716c; font-weight: 700;">
                Customer Information
              </h4>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 14px; margin: 0 0 24px; padding: 14px 18px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78716c; width: 120px; font-weight: 600;">Full Name:</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #1c1917; font-weight: 700;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78716c; font-weight: 600;">Email Address:</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #1c1917;">
                    <a href="mailto:${customerEmail}" style="color: #9f1239; text-decoration: underline;">${customerEmail}</a>
                  </td>
                </tr>
                ${customerPhone ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78716c; font-weight: 600;">Phone Number:</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #1c1917;">${customerPhone}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #78716c; font-weight: 600;">Order Ref:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #1c1917; font-weight: 600;">${orderReference}</td>
                </tr>
              </table>

              ${booking ? `
              <!-- Coaching Session Booking Details -->
              <h4 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.2px; color: #047857; font-weight: 700;">
                📅 Scheduled 1-on-1 Coaching Session
              </h4>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; margin: 0 0 24px; padding: 14px 18px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #065f46; width: 120px; font-weight: 600;">Date & Time:</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #064e3b; font-weight: 700;">${booking.scheduledDate} at ${booking.startTime}</td>
                </tr>
                ${booking.coachName ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #065f46; font-weight: 600;">Lead Coach:</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #064e3b;">${booking.coachName}</td>
                </tr>
                ` : ''}
                ${booking.meetingLink ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #065f46; font-weight: 600;">Meeting Link:</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #047857;">
                    <a href="${booking.meetingLink}" target="_blank" style="color: #047857; text-decoration: underline; font-family: monospace; word-break: break-all;">${booking.meetingLink}</a>
                  </td>
                </tr>
                ` : ''}
              </table>
              ` : ''}

              <!-- Admin Quick Action Links -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${adminOrdersUrl}" style="display: inline-block; background-color: #1c1917; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 12px; font-weight: 600; font-size: 13px; margin: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);">
                      📊 View Orders in Admin Portal &rarr;
                    </a>
                    <a href="${adminCustomersUrl}" style="display: inline-block; background-color: #ffffff; border: 1.5px solid #d6d3d1; color: #44403c; text-decoration: none; padding: 11px 22px; border-radius: 12px; font-weight: 600; font-size: 13px; margin: 4px;">
                      👥 View Customers
                    </a>
                  </td>
                </tr>
              </table>

              <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #f5f5f4;">
                <p style="margin: 0; font-size: 11px; color: #a8a29e; line-height: 1.5;">
                  This is an automated administrative dispatch configured in your Becoming Her Platform Settings. To adjust notification recipient addresses, visit the Admin Settings console.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 20px 28px; border-top: 1px solid #f5f5f4; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #78716c;">
                © ${currentYear} ${brandName} Administration Console.
              </p>
              <p style="margin: 0; font-size: 10px; color: #a8a29e;">
                Recipients: ${recipients.join(', ')}
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

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'Becoming Her <onboarding@resend.dev>';

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailFrom,
          to: recipients,
          subject,
          html: htmlContent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Resend admin notification error');
      }

      store.addAuditLog(
        'ADMIN_NOTIFICATION_SENT',
        'ADMIN',
        `Admin order alert for ${orderReference} (${customerName}) dispatched to: ${recipients.join(', ')} (ID: ${data.id})`
      );

      return {
        success: true,
        provider: 'RESEND',
        message: `Admin notification dispatched to ${recipients.join(', ')}`,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error('Error dispatching admin notification email via Resend:', err);
      store.addAuditLog(
        'ADMIN_NOTIFICATION_FAILED',
        'ADMIN',
        `Failed to send admin notification for order ${orderReference}: ${err.message}`
      );
    }
  }

  store.addAuditLog(
    'ADMIN_NOTIFICATION_SIMULATED',
    'ADMIN',
    `Simulated admin order alert for ${orderReference} to ${recipients.join(', ')}`
  );

  return {
    success: true,
    provider: 'SIMULATED',
    message: `Admin notification simulated for ${recipients.join(', ')}`,
    timestamp: new Date().toISOString()
  };
}

