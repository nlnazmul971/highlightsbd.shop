/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to HIGHLIGHTS — Confirm your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIGHLIGHTS</Text>
        <Hr style={divider} />
        <Heading style={h1}>Welcome</Heading>
        <Text style={text}>
          Thank you for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>HIGHLIGHTS</strong>
          </Link>
          . We're delighted to have you.
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          VERIFY EMAIL
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: '#141414', textDecoration: 'underline' }
const button = {
  backgroundColor: '#141414',
  color: '#ffffff',
  fontSize: '12px',
  borderRadius: '0px',
  padding: '14px 32px',
  textDecoration: 'none',
  letterSpacing: '0.2em',
  fontWeight: '500' as const,
}
const footer = { fontSize: '11px', color: '#999999', margin: '35px 0 0', letterSpacing: '0.02em' }
