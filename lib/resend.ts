import { Resend } from 'resend'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

export const FROM_EMAIL = 'EASYDRIFT <tickets@easydrift-experience.com>'
