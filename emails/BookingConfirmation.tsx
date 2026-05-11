import {
  Body, Container, Head, Html, Img, Preview,
  Row, Column, Section, Text, Hr,
} from '@react-email/components'
import { formatTime, formatDate } from '@/lib/utils'

interface Props {
  firstName: string
  lastName: string
  activityLabel: string
  day: string
  startTime: string
  endTime: string
  ticketCode: string
  appUrl: string
  bookingId: string
}

export function BookingConfirmationEmail({
  firstName, lastName, activityLabel, day, startTime, endTime,
  ticketCode, appUrl, bookingId,
}: Props) {
  const confirmationUrl = `${appUrl}/confirmation/${bookingId}`
  const qrData = `${appUrl}/admin/scanner?code=${ticketCode}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=000000&margin=10`

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre ticket EasyDrift — {activityLabel} — {ticketCode}</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Img
              src={`${appUrl}/logo-easydrift.png`}
              alt="EasyDrift"
              width="160"
              style={{ margin: '0 auto', display: 'block' }}
            />
            <Text style={subTitle}>JAPN Car à Montlhéry</Text>
          </Section>

          {/* Confirmation */}
          <Section style={section}>
            <Text style={greeting}>Bonjour {firstName},</Text>
            <Text style={body_text}>
              Votre réservation est confirmée ! Retrouvez votre ticket ci-dessous.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Détails de la réservation */}
          <Section style={section}>
            <Text style={label}>VOTRE RÉSERVATION</Text>
            <Row>
              <Column>
                <Text style={detail_label}>Activité</Text>
                <Text style={detail_value}>{activityLabel}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detail_label}>Date</Text>
                <Text style={detail_value}>{formatDate(day)}</Text>
              </Column>
              <Column>
                <Text style={detail_label}>Horaire</Text>
                <Text style={detail_value}>{formatTime(startTime)} — {formatTime(endTime)}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detail_label}>Participant</Text>
                <Text style={detail_value}>{firstName} {lastName.toUpperCase()}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* QR Code */}
          <Section style={{ ...section, textAlign: 'center' as const }}>
            <Text style={label}>VOTRE QR CODE D'ENTRÉE</Text>
            <Img
              src={qrImageUrl}
              alt="QR Code"
              width="180"
              height="180"
              style={{ margin: '0 auto', borderRadius: '12px', display: 'block' }}
            />
            <Text style={ticketCodeStyle}>{ticketCode}</Text>
            <Text style={hint_text}>Présentez ce QR code à l'entrée</Text>
          </Section>

          <Hr style={hr} />

          {/* CTA — table-based button for maximum email client compatibility */}
          <Section style={{ ...section, textAlign: 'center' as const }}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
              <tbody>
                <tr>
                  <td align="center">
                    <a href={confirmationUrl} style={cta_button}>
                      Voir mon ticket en ligne
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          {/* Infos pratiques */}
          <Section style={section}>
            <Text style={label}>INFORMATIONS PRATIQUES</Text>
            <Text style={body_text}>📍 Circuit de Montlhéry, 91310 Linas</Text>
            <Text style={body_text}>🚗 Parking gratuit sur place</Text>
            <Text style={body_text}>⏰ Présentez-vous 20 minutes avant votre créneau</Text>
            <Text style={body_text}>📱 Votre QR code sera scanné à l'entrée</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footer_text}>EasyDrift JAPN Car · maxence.fortier@easydriftdts.com</Text>
            <Text style={footer_text}>En cas de problème, répondez à cet email.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#0A0A0A',
  fontFamily: '"DM Sans", Arial, sans-serif',
  margin: 0,
  padding: '20px 0',
}

const container: React.CSSProperties = {
  maxWidth: '520px',
  margin: '0 auto',
  backgroundColor: '#111111',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #222222',
}

const header: React.CSSProperties = {
  backgroundColor: '#0A0A0A',
  padding: '24px 32px',
  textAlign: 'center',
  borderBottom: '1px solid #222222',
}

const subTitle: React.CSSProperties = {
  color: '#888888',
  fontSize: '13px',
  margin: '8px 0 0',
}

const section: React.CSSProperties = {
  padding: '24px 32px',
}

const greeting: React.CSSProperties = {
  color: '#F5F5F5',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const body_text: React.CSSProperties = {
  color: '#888888',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '4px 0',
}

const label: React.CSSProperties = {
  color: '#F47B20',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
}

const detail_label: React.CSSProperties = {
  color: '#888888',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  margin: '0 0 2px',
}

const detail_value: React.CSSProperties = {
  color: '#F5F5F5',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const ticketCodeStyle: React.CSSProperties = {
  fontFamily: '"Bebas Neue", Arial Black, sans-serif',
  fontSize: '24px',
  letterSpacing: '0.15em',
  color: '#F5F5F5',
  margin: '12px 0 4px',
}

const hint_text: React.CSSProperties = {
  color: '#888888',
  fontSize: '12px',
  margin: '0',
}

const cta_button: React.CSSProperties = {
  backgroundColor: '#F47B20',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
  msoHide: 'all',
} as React.CSSProperties

const hr: React.CSSProperties = {
  borderColor: '#222222',
  margin: 0,
}

const footer: React.CSSProperties = {
  backgroundColor: '#0A0A0A',
  padding: '16px 32px',
  textAlign: 'center' as const,
  borderTop: '1px solid #222222',
}

const footer_text: React.CSSProperties = {
  color: '#555555',
  fontSize: '11px',
  margin: '2px 0',
}

export default BookingConfirmationEmail
