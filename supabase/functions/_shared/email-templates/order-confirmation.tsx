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

interface OrderConfirmationEmailProps {
  customerName: string
  orderId: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  deliveryMethod: string
  paymentMethod: string
  address: string
  city: string
  phone: string
}

export const OrderConfirmationEmail = ({
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
}: OrderConfirmationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Order Confirmed — HIGHLIGHTS #{orderId?.slice(0, 8)}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIGHLIGHTS</Text>
        <Hr style={divider} />
        <Heading style={h1}>Order Confirmed</Heading>
        <Text style={text}>
          Thank you, {customerName}. Your order has been placed successfully.
        </Text>
        <Text style={orderIdStyle}>
          Order #{orderId?.slice(0, 8).toUpperCase()}
        </Text>

        <Hr style={divider} />

        {/* Items */}
        <Text style={sectionTitle}>ORDER DETAILS</Text>
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

        {/* Totals */}
        <Section style={totalsSection}>
          <Row>
            <Column style={totalLabel}>Subtotal</Column>
            <Column style={totalValue}>৳{subtotal}</Column>
          </Row>
          <Row>
            <Column style={totalLabel}>Delivery ({deliveryMethod})</Column>
            <Column style={totalValue}>৳{deliveryFee}</Column>
          </Row>
          {discount > 0 && (
            <Row>
              <Column style={totalLabel}>Discount</Column>
              <Column style={{ ...totalValue, color: '#16a34a' }}>−৳{discount}</Column>
            </Row>
          )}
        </Section>

        <Hr style={lightDivider} />

        <Section style={totalsSection}>
          <Row>
            <Column style={grandTotalLabel}>Total</Column>
            <Column style={grandTotalValue}>৳{total}</Column>
          </Row>
        </Section>

        <Hr style={divider} />

        {/* Delivery Info */}
        <Text style={sectionTitle}>DELIVERY</Text>
        <Text style={infoText}>{address}, {city}</Text>
        <Text style={infoText}>Phone: {phone}</Text>
        <Text style={infoText}>Payment: {paymentMethod?.toUpperCase()}</Text>

        <Hr style={divider} />

        <Text style={footer}>
          Thank you for shopping with HIGHLIGHTS. We'll process your order shortly.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default OrderConfirmationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '500px', margin: '0 auto' }
const brand = {
  fontSize: '18px',
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
  fontSize: '24px',
  fontWeight: '300' as const,
  color: '#141414',
  margin: '0 0 15px',
  fontFamily: "'Playfair Display', Georgia, serif",
  letterSpacing: '0.1em',
}
const text = {
  fontSize: '14px',
  color: '#737373',
  lineHeight: '1.6',
  margin: '0 0 15px',
  letterSpacing: '0.02em',
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
const totalLabel = { fontSize: '13px', color: '#737373', width: '70%' }
const totalValue = { fontSize: '13px', color: '#141414', width: '30%', textAlign: 'right' as const }
const grandTotalLabel = { fontSize: '15px', color: '#141414', fontWeight: '600' as const, width: '70%' }
const grandTotalValue = { fontSize: '15px', color: '#141414', fontWeight: '600' as const, width: '30%', textAlign: 'right' as const }
const infoText = { fontSize: '13px', color: '#555', margin: '0 0 4px' }
const footer = { fontSize: '11px', color: '#999999', margin: '25px 0 0', letterSpacing: '0.02em' }
