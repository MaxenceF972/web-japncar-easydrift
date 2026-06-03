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
      <Body style={{ backgroundColor: '#0A0A0A', fontFamily: 'Arial, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>
          <Img
            src={`${appUrl}/logo-easydrift.png`}
            alt="EASYDRIFT"
            width={160}
            height={50}
            style={{ objectFit: 'contain', marginBottom: 24 }}
          />

          <Text style={{ color: '#F5F5F5', fontSize: 24, fontWeight: 'bold', margin: '0 0 8px' }}>
            🎬 Ta vidéo est disponible, {firstName} !
          </Text>
          <Text style={{ color: '#888', fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
            Merci d'avoir participé au <strong style={{ color: '#F47B20' }}>Baptême EASYDRIFT</strong> lors du JAPN Car à Montlhéry.
            On a filmé ton passage — voici ton extrait exclusif.
          </Text>

          <Section style={{ backgroundColor: '#1A1A1A', borderRadius: 12, padding: '24px', marginBottom: 24, border: '1px solid #222' }}>
            <Text style={{ color: '#F5F5F5', fontSize: 16, margin: '0 0 16px', fontWeight: 'bold' }}>
              🎥 Voir mon extrait (10-15 sec)
            </Text>
            <Text style={{ color: '#888', fontSize: 14, margin: '0 0 20px' }}>
              Regarde ton passage en dérive et débloque la vidéo complète pour seulement <strong style={{ color: '#F47B20' }}>30€</strong>.
            </Text>
            <Button
              href={previewPageUrl}
              style={{
                backgroundColor: '#F47B20',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: 10,
                fontWeight: 'bold',
                fontSize: 15,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              ▶ Voir mon extrait
            </Button>
          </Section>

          <Hr style={{ borderColor: '#222', margin: '24px 0' }} />

          <Text style={{ color: '#555', fontSize: 12, textAlign: 'center' }}>
            EASYDRIFT · JAPN Car · Circuit de Montlhéry
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
