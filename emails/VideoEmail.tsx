import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr
} from '@react-email/components'

interface VideoEmailProps {
  firstName: string
  previewPageUrl: string
  appUrl: string
}

export function VideoEmail({ firstName, previewPageUrl, appUrl }: VideoEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#111111', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', backgroundColor: '#111111' }}>

          {/* Header */}
          <Section style={{ backgroundColor: '#1A1A1A', borderRadius: '12px 12px 0 0', padding: '28px 32px', textAlign: 'center', borderBottom: '2px solid #F47B20' }}>
            <Img
              src={`${appUrl}/logo-easydrift.png`}
              alt="EASYDRIFT"
              width={140}
              height={44}
              style={{ objectFit: 'contain', margin: '0 auto 20px' }}
            />
            <Text style={{ color: '#F5F5F5', fontSize: 26, fontWeight: 'bold', margin: '0 0 6px', lineHeight: 1.2 }}>
              Votre souvenir vous attend
            </Text>
            <Text style={{ color: '#F47B20', fontSize: 14, fontWeight: 'bold', margin: 0 }}>
              Jap'N'Car × Montlhéry 2026
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: '#1A1A1A', padding: '28px 32px' }}>
            <Text style={{ color: '#F5F5F5', fontSize: 16, margin: '0 0 8px' }}>
              <strong>Bonjour {firstName},</strong>
            </Text>
            <Text style={{ color: '#CCCCCC', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
              Merci d'avoir vécu cette expérience avec nous ! On espère que vous avez kiffé.
              On a capturé un moment de votre baptême EASYDRIFT — regardez ça :
            </Text>

            <Button
              href={previewPageUrl}
              style={{
                backgroundColor: '#F47B20',
                color: '#fff',
                padding: '14px 0',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 14,
                letterSpacing: 2,
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center',
                width: '100%',
              }}
            >
              APERÇU GRATUIT
            </Button>
          </Section>

          <Hr style={{ borderColor: '#2A2A2A', margin: 0 }} />

          {/* Upsell */}
          <Section style={{ backgroundColor: '#1A1A1A', padding: '24px 32px' }}>
            <Text style={{ color: '#F5F5F5', fontSize: 15, fontWeight: 'bold', margin: '0 0 8px' }}>
              Vous voulez la vidéo complète de votre passage ?
            </Text>
            <Text style={{ color: '#CCCCCC', fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>
              Téléchargez-la en HD pour la garder et la partager.
            </Text>
            <Text style={{ color: '#CCCCCC', fontSize: 14, margin: '0 0 6px' }}>🎬 Vidéo complète en HD</Text>
            <Text style={{ color: '#CCCCCC', fontSize: 14, margin: '0 0 6px' }}>⬇️ Téléchargement immédiat après paiement</Text>
            <Text style={{ color: '#CCCCCC', fontSize: 14, margin: '0 0 20px' }}>⏱ Lien disponible 48h après paiement</Text>

            <Button
              href={previewPageUrl}
              style={{
                backgroundColor: '#F47B20',
                color: '#fff',
                padding: '14px 0',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 15,
                letterSpacing: 1,
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center',
                width: '100%',
              }}
            >
              Obtenir ma vidéo complète — 30 € ↗
            </Button>
          </Section>

          <Hr style={{ borderColor: '#2A2A2A', margin: 0 }} />

          {/* Footer */}
          <Section style={{ backgroundColor: '#1A1A1A', borderRadius: '0 0 12px 12px', padding: '20px 32px' }}>
            <Text style={{ color: '#CCCCCC', fontSize: 14, margin: '0 0 8px', lineHeight: 1.6 }}>
              À très vite. Si vous avez des questions, contactez{' '}
              <a href="mailto:maxence.fortier@easydriftdts.com" style={{ color: '#F47B20', textDecoration: 'none' }}>
                maxence.fortier@easydriftdts.com
              </a>
            </Text>
            <Text style={{ color: '#F5F5F5', fontSize: 15, fontWeight: 'bold', margin: 0 }}>
              L'équipe <span style={{ color: '#F47B20' }}>EASYDRIFT</span>
            </Text>
          </Section>

          {/* Bottom bar */}
          <Section style={{ padding: '16px 32px', textAlign: 'center' }}>
            <Text style={{ color: '#555', fontSize: 11, margin: '0 0 4px' }}>
              EASYDRIFT Experience — easydrift-experience.com
            </Text>
            <Text style={{ color: '#555', fontSize: 11, margin: 0 }}>
              Vous recevez cet email car vous avez participé au Jap'N'Car 2026.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
