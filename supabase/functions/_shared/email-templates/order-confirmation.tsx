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
    <Preview>Your HIGHLIGHTS order #{orderId?.slice(0, 8).toUpperCase()}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIGHLIGHTS</Text>
        <Hr style={divider} />
        <Heading style={h1}>Order Confirmed</Heading>
        <Text style={text}>
          Hi {customerName}, thank you for your order. We have received it and will process it shortly.
        </Text>
        <Text style={orderIdStyle}>
          Order #{orderId?.slice(0, 8).toUpperCase()}
        </Text>

        <Hr style={divider} />

        <Text style={sectionTitle}>Order Details</Text>
        {(items || []).map((item, i) => (
          <Section key={i} style={itemRow}>
            <Row>
              <Column style={itemName}>
                {item.name}
                {item.size ? ` - ${item.size}` : ''}
                {item.color ? ` / ${item.color}` : ''}
              </Column>
              <Column style={itemQty}>x{item.quantity}</Column>
              <Column style={itemPrice}>BDT {item.price * item.quantity}</Column>
            </Row>
          </Section>
        ))}

        <Hr style={lightDivider} />

        <Section style={totalsSection}>
          <Row>
            <Column style={totalLabel}>Subtotal</Column>
            <Column style={totalValue}>BDT {subtotal}</Column>
          </Row>
          <Row>
            <Column style={totalLabel}>Delivery ({deliveryMethod})</Column>
            <Column style={totalValue}>BDT {deliveryFee}</Column>
          </Row>
          {discount > 0 && (
            <Row>
              <Column style={totalLabel}>Discount</Column>
              <Column style={{ ...totalValue, color: '#16a34a' }}>-BDT {discount}</Column>
            </Row>
          )}
        </Section>

        <Hr style={lightDivider} />

        <Section style={totalsSection}>
          <Row>
            <Column style={grandTotalLabel}>Total</Column>
            <Column style={grandTotalValue}>BDT {total}</Column>
          </Row>
        </Section>

        <Hr style={divider} />

        <Text style={sectionTitle}>Delivery Information</Text>
        <Text style={infoText}>{address}, {city}</Text>
        <Text style={infoText}>Phone: {phone}</Text>
        <Text style={infoText}>Payment: {paymentMethod?.toUpperCase()}</Text>

        <Hr style={divider} />

        <Text style={footer}>
          Thank you for shopping with HIGHLIGHTS. If you have any questions, please reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default OrderConfirmationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "Arial, Helvetica, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '500px', margin: '0 auto' }
const brand = {
  fontSize: '18px',
  fontWeight: '700' as const,
  letterSpacing: '0.2em',
  color: '#333333',
  textAlign: 'center' as const,
  margin: '0 0 20px',
}
const divider = { borderColor: '#e0e0e0', margin: '20px 0' }
const lightDivider = { borderColor: '#f0f0f0', margin: '10px 0' }
const h1 = {
  fontSize: '22px',
  fontWeight: '600' as const,
  color: '#333333',
  margin: '0 0 15px',
}
const text = {
  fontSize: '14px',
  color: '#555555',
  lineHeight: '1.6',
  margin: '0 0 15px',
}
const orderIdStyle = {
  fontSize: '13px',
  color: '#333333',
  letterSpacing: '0.1em',
  fontWeight: '500' as const,
  margin: '0 0 5px',
}
const sectionTitle = {
  fontSize: '12px',
  color: '#333333',
  letterSpacing: '0.1em',
  fontWeight: '600' as const,
  margin: '15px 0 10px',
}
const itemRow = { margin: '0 0 6px' }
const itemName = { fontSize: '13px', color: '#333333', width: '60%' }
const itemQty = { fontSize: '13px', color: '#777777', width: '15%', textAlign: 'center' as const }
const itemPrice = { fontSize: '13px', color: '#333333', width: '25%', textAlign: 'right' as const }
const totalsSection = { margin: '5px 0' }
const totalLabel = { fontSize: '13px', color: '#777777', width: '70%' }
const totalValue = { fontSize: '13px', color: '#333333', width: '30%', textAlign: 'right' as const }
const grandTotalLabel = { fontSize: '15px', color: '#333333', fontWeight: '600' as const, width: '70%' }
const grandTotalValue = { fontSize: '15px', color: '#333333', fontWeight: '600' as const, width: '30%', textAlign: 'right' as const }
const infoText = { fontSize: '13px', color: '#555555', margin: '0 0 4px' }
const footer = { fontSize: '12px', color: '#999999', margin: '25px 0 0' }
