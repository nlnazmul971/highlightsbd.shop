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

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code — HIGHLIGHTS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIGHLIGHTS</Text>
        <Hr style={divider} />
        <Heading style={h1}>Verification Code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const divider = { borderColor: '#e0e0e0', margin: '0 0 30px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '300' as const,
  color: '#141414',
  margin: '0 0 20px',
  fontFamily: "'Playfair Display', Georgia, serif",
  letterSpacing: '0.1em',
}
const text = {
  fontSize: '14px',
  color: '#737373',
  lineHeight: '1.6',
  margin: '0 0 25px',
  letterSpacing: '0.02em',
}
const codeStyle = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '28px',
  fontWeight: '600' as const,
  color: '#141414',
  margin: '0 0 30px',
  letterSpacing: '0.15em',
}
const footer = { fontSize: '11px', color: '#999999', margin: '35px 0 0', letterSpacing: '0.02em' }
