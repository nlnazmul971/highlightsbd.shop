import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { OrderConfirmationEmail } from '../_shared/email-templates/order-confirmation.tsx'
import { AdminOrderNotification } from '../_shared/email-templates/admin-order-notification.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_NAME = 'HIGHLIGHTS'
const FROM_EMAIL = `${SITE_NAME} <noreply@highlightsbd.shop>`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const body = await req.json()
    const {
      to,
      customerName,
      orderId,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      deliveryMethod,
      paymentMethod,
      address,
      city,
      phone,
    } = body

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const templateProps = {
      customerName: customerName || 'Customer',
      orderId,
      items: items || [],
      subtotal: subtotal || 0,
      deliveryFee: deliveryFee || 0,
      discount: discount || 0,
      total: total || 0,
      deliveryMethod: deliveryMethod || 'Standard',
      paymentMethod: paymentMethod || 'COD',
      address: address || '',
      city: city || '',
      phone: phone || '',
    }

    const results: { customer?: string; admin?: string } = {}

    // 1. Send customer confirmation email
    if (to) {
      const customerHtml = await renderAsync(React.createElement(OrderConfirmationEmail, templateProps))
      const customerRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject: `Order Confirmed — HIGHLIGHTS #${orderId.slice(0, 8).toUpperCase()}`,
          html: customerHtml,
        }),
      })
      const customerData = await customerRes.json()
      if (!customerRes.ok) {
        console.error('Resend customer email error:', customerData)
      } else {
        results.customer = customerData.id
        console.log('Customer email sent', { orderId, to, id: customerData.id })
      }
    }

    // 2. Send admin notification email
    const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL')
    if (adminEmail) {
      const adminHtml = await renderAsync(
        React.createElement(AdminOrderNotification, {
          ...templateProps,
          customerEmail: to || undefined,
        })
      )
      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [adminEmail],
          subject: `🛒 New Order #${orderId.slice(0, 8).toUpperCase()} — ৳${total || 0}`,
          html: adminHtml,
        }),
      })
      const adminData = await adminRes.json()
      if (!adminRes.ok) {
        console.error('Resend admin email error:', adminData)
      } else {
        results.admin = adminData.id
        console.log('Admin notification sent', { orderId, adminEmail, id: adminData.id })
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to send order emails:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
