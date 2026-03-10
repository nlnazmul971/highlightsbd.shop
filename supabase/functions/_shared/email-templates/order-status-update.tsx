/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface OrderStatusEmailProps {
  customerName: string
  orderId: string
  status: string
  trackingCode?: string
  courierProvider?: string
}

const STATUS_MESSAGES: Record<string, { title: string; message: string }> = {
  Processing: {
    title: 'Order is Being Processed',
    message: 'Your order is now being processed and will be shipped soon.',
  },
  Shipped: {
    title: 'Order Shipped',
    message: 'Your order has been shipped and is on its way to you.',
  },
  Delivered: {
    title: 'Order Delivered',
    message: 'Your order has been delivered. Thank you for shopping with us!',
  },
  Cancelled: {
    title: 'Order Cancelled',
    message: 'Your order has been cancelled. If you have any questions, please contact our support.',
  },
}

export const OrderStatusEmail = ({
  customerName,
  orderId,
  status,
  trackingCode,
  courierProvider,
}: OrderStatusEmailProps) => {
  const shortId = orderId?.slice(0, 8).toUpperCase() || ''
  const statusInfo = STATUS_MESSAGES[status] || { title: `Order ${status}`, message: `Your order status has been updated to: ${status}.` }

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Order #${shortId} - ${statusInfo.title}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>HIGHLIGHTS</Text>
          <Hr style={divider} />
          <Heading style={h1}>{statusInfo.title}</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>{statusInfo.message}</Text>
          <Text style={orderIdStyle}>Order #{shortId}</Text>
          <Text style={statusBadge}>Status: {status}</Text>
          {trackingCode && (
            <Text style={text}>
              Tracking Code: <strong>{trackingCode}</strong>
              {courierProvider && ` (${courierProvider === 'steadfast' ? 'Steadfast' : courierProvider === 'pathao' ? 'Pathao' : courierProvider})`}
            </Text>
          )}
          <Hr style={divider} />
          <Text style={footer}>
            If you have any questions, reply to this email or contact us at support@highlightsbd.shop
          </Text>
          <Text style={footer}>Thank you for shopping with HIGHLIGHTS.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderStatusEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '500px', margin: '0 auto' }
const brand = {
  fontSize: '18px',
  fontWeight: '700' as const,
  letterSpacing: '0.35em',
  color: '#141414',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}
const divider = { borderColor: '#e0e0e0', margin: '20px 0' }
const h1 = {
  fontSize: '22px',
  fontWeight: '400' as const,
  color: '#141414',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#555555',
  lineHeight: '1.6',
  margin: '0 0 12px',
}
const orderIdStyle = {
  fontSize: '13px',
  color: '#333333',
  fontFamily: 'monospace',
  margin: '16px 0 8px',
}
const statusBadge = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#141414',
  margin: '0 0 16px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '8px 0 0' }
