import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { OrderConfirmationEmail } from '../_shared/email-templates/order-confirmation.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_NAME = 'HIGHLIGHTS'
const SENDER_DOMAIN = 'notify.highlightsbd.shop'
const FROM_DOMAIN = 'highlightsbd.shop'
const API_BASE_URL = 'https://api.lovable.dev'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured')
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

    if (!to || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, orderId' }),
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

    const html = await renderAsync(React.createElement(OrderConfirmationEmail, templateProps))
    const text = await renderAsync(React.createElement(OrderConfirmationEmail, templateProps), {
      plainText: true,
    })

    const subject = `Order Confirmed — HIGHLIGHTS #${orderId.slice(0, 8).toUpperCase()}`

    // Send via Lovable Email API directly
    const emailResponse = await fetch(`${API_BASE_URL}/api/v1/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
      }),
    })

    const responseText = await emailResponse.text()

    if (!emailResponse.ok) {
      console.error('Email API error:', emailResponse.status, responseText)
      throw new Error(`Email API error: ${emailResponse.status} ${responseText}`)
    }

    let result = {}
    try { result = JSON.parse(responseText) } catch { /* ok */ }
    console.log('Order confirmation email sent', { orderId, to, status: emailResponse.status })

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to send order confirmation email:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
