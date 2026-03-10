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
  Section,
  Text,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'

interface OrderItem {
  name: string
  quantity: number
  price: number
  size?: string
  color?: string
}

interface AdminOrderNotificationProps {
  orderId: string
  customerName: string
  items: OrderItem[]
  total: number
  deliveryMethod: string
  paymentMethod: string
  address: string
  city: string
  phone: string
  customerEmail?: string
}

export const AdminOrderNotification = ({
  orderId,
  customerName,
  items,
  total,
  deliveryMethod,
  paymentMethod,
  address,
  city,
  phone,
  customerEmail,
}: AdminOrderNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🛒 New Order #{orderId?.slice(0, 8)} — ৳{total}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIGHLIGHTS — ADMIN</Text>
        <Hr style={divider} />
        <Heading style={h1}>🛒 New Order Received</Heading>
        <Text style={orderIdStyle}>
          Order #{orderId?.slice(0, 8).toUpperCase()}
        </Text>

        <Hr style={divider} />

        <Text style={sectionTitle}>CUSTOMER</Text>
        <Text style={infoText}><strong>Name:</strong> {customerName}</Text>
        <Text style={infoText}><strong>Phone:</strong> {phone}</Text>
        {customerEmail && <Text style={infoText}><strong>Email:</strong> {customerEmail}</Text>}
        <Text style={infoText}><strong>Address:</strong> {address}, {city}</Text>

        <Hr style={divider} />

        <Text style={sectionTitle}>ITEMS</Text>
        {(items || []).map((item, i) => (
          <Section key={i} style={itemRow}>
            <Row>
              <Column style={itemName}>
                {item.name}
                {item.size ? ` — ${item.size}` : ''}
                {item.color ? ` / ${item.color}` : ''}
              </Column>
              <Column style={itemQty}>×{item.quantity}</Column>
              <Column style={itemPrice}>৳{item.price * item.quantity}</Column>
            </Row>
          </Section>
        ))}

        <Hr style={lightDivider} />

        <Section style={totalsSection}>
          <Row>
            <Column style={grandTotalLabel}>Total</Column>
            <Column style={grandTotalValue}>৳{total}</Column>
          </Row>
        </Section>

        <Hr style={divider} />

        <Text style={sectionTitle}>ORDER INFO</Text>
        <Text style={infoText}><strong>Delivery:</strong> {deliveryMethod}</Text>
        <Text style={infoText}><strong>Payment:</strong> {paymentMethod?.toUpperCase()}</Text>

        <Hr style={divider} />

        <Text style={footer}>
          This is an automated notification from HIGHLIGHTS.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default AdminOrderNotification

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '500px', margin: '0 auto' }
const brand = {
  fontSize: '16px',
  fontWeight: '700' as const,
  letterSpacing: '0.35em',
  color: '#141414',
  textAlign: 'center' as const,
  margin: '0 0 20px',
  fontFamily: "'Playfair Display', Georgia, serif",
}
const divider = { borderColor: '#e0e0e0', margin: '20px 0' }
const lightDivider = { borderColor: '#f0f0f0', margin: '10px 0' }
const h1 = {
  fontSize: '22px',
  fontWeight: '300' as const,
  color: '#141414',
  margin: '0 0 15px',
  fontFamily: "'Playfair Display', Georgia, serif",
}
const orderIdStyle = {
  fontSize: '13px',
  color: '#141414',
  letterSpacing: '0.15em',
  fontWeight: '500' as const,
  margin: '0 0 5px',
}
const sectionTitle = {
  fontSize: '11px',
  color: '#141414',
  letterSpacing: '0.2em',
  fontWeight: '600' as const,
  margin: '15px 0 10px',
  textTransform: 'uppercase' as const,
}
const itemRow = { margin: '0 0 6px' }
const itemName = { fontSize: '13px', color: '#333', width: '60%' }
const itemQty = { fontSize: '13px', color: '#737373', width: '15%', textAlign: 'center' as const }
const itemPrice = { fontSize: '13px', color: '#141414', width: '25%', textAlign: 'right' as const }
const totalsSection = { margin: '5px 0' }
const grandTotalLabel = { fontSize: '15px', color: '#141414', fontWeight: '600' as const, width: '70%' }
const grandTotalValue = { fontSize: '15px', color: '#141414', fontWeight: '600' as const, width: '30%', textAlign: 'right' as const }
const infoText = { fontSize: '13px', color: '#555', margin: '0 0 4px' }
const footer = { fontSize: '11px', color: '#999999', margin: '25px 0 0', letterSpacing: '0.02em' }
