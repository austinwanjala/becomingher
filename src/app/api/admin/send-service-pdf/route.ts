import { NextResponse } from 'next/server';
import { sendServicePdfEmail } from '@/lib/email/delivery';
import { getServiceById } from '@/lib/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerEmail, customerName, serviceId, orderReference, pdfUrl, pdfName, pdfTitle } = body;

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is required.' }, { status: 400 });
    }

    const service = (await getServiceById(serviceId)) || { id: 'srv-guided-01', name: 'Default Service' };

    const result = await sendServicePdfEmail({
      customerEmail: customerEmail.trim(),
      customerName: customerName?.trim() || 'Beloved Member',
      serviceId: service.id,
      serviceTitle: service.name,
      orderReference: orderReference || `BH-MANUAL-${Date.now().toString().slice(-5)}`,
      pdfUrl,
      pdfName,
      pdfTitle
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error dispatching service PDF email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
