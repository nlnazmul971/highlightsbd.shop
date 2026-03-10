import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { sendLovableEmail } from 'npm:@lovable.dev/email-js'
import { OrderConfirmationEmail } from '../_shared/email-templates/order-confirmation.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const SITE_NAME = 'HIGHLIGHTS'
const SENDER_DOMAIN = 'notify.highlightsbd.shop'
const FROM_DOMAIN = 'highlightsbd.shop'

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

    const result = await sendLovableEmail(
      {
        run_id: crypto.randomUUID(),
        to,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Order Confirmed — HIGHLIGHTS #${orderId.slice(0, 8).toUpperCase()}`,
        html,
        text,
        purpose: 'transactional',
      },
      { apiKey }
    )

    console.log('Order confirmation email sent', { orderId, to, message_id: result.message_id })

    return new Response(
      JSON.stringify({ success: true, message_id: result.message_id }),
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
