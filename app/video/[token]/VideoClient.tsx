'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

function getDriveId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function getDriveEmbedUrl(url: string): string {
  const id = getDriveId(url)
  return id ? `https://drive.google.com/file/d/${id}/preview` : url
}

function getDownloadUrl(url: string): string {
  // WeTransfer ou autre lien direct → utiliser tel quel
  if (!url.includes('drive.google.com')) return url
  const id = getDriveId(url)
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url
}

interface Props {
  order: {
    id: string
    download_token: string
    preview_url: string
    full_video_url: string
    payment_status: string
    sumup_checkout_id: string | null
  }
  firstName: string
}

export function VideoClient({ order, firstName }: Props) {
  const [paid, setPaid] = useState(order.payment_status === 'paid')
  const [checkoutId, setCheckoutId] = useState<string | null>(order.sumup_checkout_id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const widgetMountedRef = useRef(false)
  const successProcessingRef = useRef(false)

  useEffect(() => {
    if (checkoutId && !paid && !widgetMountedRef.current) {
      widgetMountedRef.current = true
      loadWidget(checkoutId)
    }
  }, [checkoutId, paid])

  async function handleBuy() {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/video/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: order.download_token }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error)
      setCheckoutId(data.checkoutId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function loadWidget(id: string) {
    const existing = document.getElementById('sumup-sdk-video')
    if (existing) existing.remove()
    const script = document.createElement('script')
    script.id = 'sumup-sdk-video'
    script.src = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.SumUpCard) {
        // @ts-ignore
        window.SumUpCard.mount({ id: 'sumup-video-widget', checkoutId: id, onResponse: handlePaymentResponse, locale: 'fr-FR' })
      }
    }
    document.body.appendChild(script)
  }

  async function handlePaymentResponse(type: string) {
    if (type === 'success' && !successProcessingRef.current) {
      successProcessingRef.current = true
      setConfirming(true)
      try {
        const resp = await fetch('/api/video/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: order.download_token, checkoutId }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error)
        setPaid(true)
      } catch (e: any) {
        setError(`Paiement reçu mais erreur : ${e.message}. Contactez-nous.`)
        successProcessingRef.current = false
      } finally {
        setConfirming(false)
      }
    } else if (type === 'error') {
      setError('Paiement refusé. Réessayez.')
    }
  }

  const previewEmbed = getDriveEmbedUrl(order.preview_url)
  const downloadUrl = getDownloadUrl(order.full_video_url)

  return (
    <main className="min-h-dvh bg-[var(--bg-primary)] pb-10">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] px-5 py-4 text-center">
        <img src="/logo-easydrift.png" alt="EASYDRIFT" className="h-10 w-auto mx-auto mb-2" />
        <p className="text-[var(--text-secondary)] text-sm">JAPN Car · Circuit de Montlhéry</p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        <div>
          <h1 className="font-bebas text-3xl text-[var(--text-primary)]">
            Hey {firstName} ! 🎬
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            On a filmé ton baptême en dérive. Voici ton extrait.
          </p>
        </div>

        {/* Preview */}
        <div className="rounded-2xl overflow-hidden bg-black aspect-video">
          <iframe
            src={previewEmbed}
            className="w-full h-full"
            allow="autoplay"
            allowFullScreen
          />
        </div>

        {paid ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 text-center"
          >
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="font-bebas text-2xl text-[var(--text-primary)] mb-2">Vidéo débloquée !</p>
            <p className="text-[var(--text-secondary)] text-sm mb-5">
              Clique pour télécharger ta vidéo complète.
            </p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta w-full font-bebas text-lg flex items-center justify-center gap-2"
            >
              <Download size={18} />
              TÉLÉCHARGER MA VIDÉO
            </a>
          </motion.div>
        ) : confirming ? (
          <div className="card p-8 text-center">
            <Loader2 size={32} className="text-[var(--accent)] animate-spin mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">Confirmation du paiement en cours...</p>
          </div>
        ) : checkoutId ? (
          <div className="card p-5 space-y-4">
            <p className="text-[var(--text-secondary)] text-sm text-center">
              <Lock size={14} className="inline mr-1" />
              Paiement sécurisé — Vidéo complète débloquée immédiatement
            </p>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <div id="sumup-video-widget" className="min-h-[280px]" />
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Vidéo complète</p>
                <p className="text-[var(--text-secondary)] text-sm">Téléchargement immédiat après paiement</p>
              </div>
              <span className="font-bebas text-3xl text-[var(--accent)]">1€</span>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={handleBuy}
              disabled={loading}
              className="btn-cta w-full font-bebas text-lg"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'ACHETER MA VIDÉO — 1€'}
            </button>
            <p className="text-[var(--text-secondary)] text-xs text-center">
              <Lock size={11} className="inline mr-1" />
              Paiement sécurisé par SumUp
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
