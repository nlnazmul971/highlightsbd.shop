import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { OrderConfirmationEmail } from '../_shared/email-templates/order-confirmation.tsx'
import { AdminOrderNotification } from '../_shared/email-templates/admin-order-notification.tsx'
import { OrderStatusEmail } from '../_shared/email-templates/order-status-update.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_NAME = 'HIGHLIGHTS'
const FROM_EMAIL = `${SITE_NAME} <orders@highlightsbd.shop>`
const REPLY_TO = 'support@highlightsbd.shop'

function generatePlainText(props: Record<string, unknown>): string {
  const items = (props.items as Array<{ name: string; quantity: number; price: number; size?: string; color?: string }>) || []
  const itemLines = items.map(
    (item) => `  ${item.name}${item.size ? ` (${item.size})` : ''}${item.color ? ` / ${item.color}` : ''} x${item.quantity} - BDT ${item.price * item.quantity}`
  ).join('\n')

  return `HIGHLIGHTS - Order Confirmation

Order #${(props.orderId as string)?.slice(0, 8).toUpperCase()}

Thank you, ${props.customerName}. Your order has been placed.

Items:
${itemLines}

Subtotal: BDT ${props.subtotal}
Delivery (${props.deliveryMethod}): BDT ${props.deliveryFee}
${(props.discount as number) > 0 ? `Discount: -BDT ${props.discount}\n` : ''}Total: BDT ${props.total}

Delivery Address: ${props.address}, ${props.city}
Phone: ${props.phone}
Payment: ${(props.paymentMethod as string)?.toUpperCase()}

Thank you for shopping with HIGHLIGHTS.`
}

function generateAdminPlainText(props: Record<string, unknown>): string {
  const items = (props.items as Array<{ name: string; quantity: number; price: number; size?: string; color?: string }>) || []
  const itemLines = items.map(
    (item) => `  ${item.name}${item.size ? ` (${item.size})` : ''}${item.color ? ` / ${item.color}` : ''} x${item.quantity} - BDT ${item.price * item.quantity}`
  ).join('\n')

  return `New Order Received - HIGHLIGHTS

Order #${(props.orderId as string)?.slice(0, 8).toUpperCase()}

Customer: ${props.customerName}
Phone: ${props.phone}
${props.customerEmail ? `Email: ${props.customerEmail}\n` : ''}Address: ${props.address}, ${props.city}

Items:
${itemLines}

Total: BDT ${props.total}
Delivery: ${props.deliveryMethod}
Payment: ${(props.paymentMethod as string)?.toUpperCase()}`
}

function generateStatusPlainText(props: { customerName: string; orderId: string; status: string; trackingCode?: string; courierProvider?: string }): string {
  const shortId = props.orderId?.slice(0, 8).toUpperCase() || ''
  const statusMessages: Record<string, string> = {
    Processing: 'Your order is now being processed and will be shipped soon.',
    Shipped: 'Your order has been shipped and is on its way to you.',
    Delivered: 'Your order has been delivered. Thank you for shopping with us!',
    Cancelled: 'Your order has been cancelled. If you have any questions, please contact our support.',
  }
  const message = statusMessages[props.status] || `Your order status has been updated to: ${props.status}.`

  return `HIGHLIGHTS - Order Update

Hi ${props.customerName},

${message}

Order #${shortId}
Status: ${props.status}
${props.trackingCode ? `Tracking Code: ${props.trackingCode}${props.courierProvider ? ` (${props.courierProvider})` : ''}\n` : ''}
If you have any questions, reply to this email or contact us at support@highlightsbd.shop

Thank you for shopping with HIGHLIGHTS.`
}

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
    const { type } = body

    // Handle status update emails
    if (type === 'status_update') {
      const { to, customerName, orderId, status, trackingCode, courierProvider } = body
      if (!to || !orderId || !status) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: to, orderId, status' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const statusProps = { customerName: customerName || 'Customer', orderId, status, trackingCode, courierProvider }
      const html = await renderAsync(React.createElement(OrderStatusEmail, statusProps))
      const text = generateStatusPlainText(statusProps)
      const shortId = orderId.slice(0, 8).toUpperCase()

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          reply_to: REPLY_TO,
          subject: `Order #${shortId} - ${status}`,
          html,
          text,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Status email error:', JSON.stringify(data))
        return new Response(JSON.stringify({ error: data }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      console.log('Status update email sent', { orderId, to, status, id: data.id })
      return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Handle order confirmation emails (default)
    const {
      to, customerName, orderId, items, subtotal, deliveryFee, discount,
      total, deliveryMethod, paymentMethod, address, city, phone,
    } = body

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const templateProps = {
      customerName: customerName || 'Customer',
      orderId, items: items || [], subtotal: subtotal || 0,
      deliveryFee: deliveryFee || 0, discount: discount || 0,
      total: total || 0, deliveryMethod: deliveryMethod || 'Standard',
      paymentMethod: paymentMethod || 'COD', address: address || '',
      city: city || '', phone: phone || '',
    }

    const results: { customer?: string; admin?: string } = {}
    const shortId = orderId.slice(0, 8).toUpperCase()

    // 1. Send customer confirmation email
    if (to) {
      const customerHtml = await renderAsync(React.createElement(OrderConfirmationEmail, templateProps))
      const customerText = generatePlainText(templateProps)
      const customerRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL, to: [to], reply_to: REPLY_TO,
          subject: `Your HIGHLIGHTS order #${shortId}`,
          html: customerHtml, text: customerText,
        }),
      })
      const customerData = await customerRes.json()
      if (!customerRes.ok) {
        console.error('Resend customer email error:', JSON.stringify(customerData))
      } else {
        results.customer = customerData.id
        console.log('Customer email sent', { orderId, to, id: customerData.id })
      }
    }

    // 2. Send admin notification email
    const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL')
    if (adminEmail) {
      const adminProps = { ...templateProps, customerEmail: to || undefined }
      const adminHtml = await renderAsync(React.createElement(AdminOrderNotification, adminProps))
      const adminText = generateAdminPlainText(adminProps)
      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL, to: [adminEmail], reply_to: REPLY_TO,
          subject: `New order #${shortId} - BDT ${total || 0}`,
          html: adminHtml, text: adminText,
        }),
      })
      const adminData = await adminRes.json()
      if (!adminRes.ok) {
        console.error('Resend admin email error:', JSON.stringify(adminData))
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
