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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to HIGHLIGHTS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>HIGHLIGHTS</Text>
        <Hr style={divider} />
        <Heading style={h1}>You're Invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>HIGHLIGHTS</strong>
          </Link>
          . Click below to accept and create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          ACCEPT INVITATION
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
