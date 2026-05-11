'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Loader2, Camera, RotateCcw } from 'lucide-react'
import { formatTime, getDayLabel } from '@/lib/utils'

type ScanStatus = 'idle' | 'scanning' | 'success' | 'already' | 'invalid' | 'error'

interface ScanResult {
  status: ScanStatus
  booking?: {
    firstName: string
    lastName: string
    activityLabel: string
    activityColor: string
    startTime: string
    day: string
    paymentStatus: string
  }
  message?: string
  timestamp: number
}

const STATUS_CONFIG = {
  success:  { bg: 'bg-green-900/40',  border: 'border-green-500/50',  icon: CheckCircle,  iconColor: 'text-green-400',  title: '✓ Check-in validé !' },
  already:  { bg: 'bg-yellow-900/40', border: 'border-yellow-500/50', icon: AlertCircle,  iconColor: 'text-yellow-400', title: 'Déjà scanné' },
  invalid:  { bg: 'bg-red-900/40',    border: 'border-red-500/50',    icon: XCircle,      iconColor: 'text-red-400',    title: 'Ticket invalide' },
  error:    { bg: 'bg-red-900/40',    border: 'border-red-500/50',    icon: XCircle,      iconColor: 'text-red-400',    title: 'Erreur' },
  scanning: { bg: '', border: '', icon: Loader2, iconColor: '', title: '' },
  idle:     { bg: '', border: '', icon: Loader2, iconColor: '', title: '' },
}

export default function ScannerPage() {
  const [status, setStatus] = useState<ScanStatus>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const [cameraStarted, setCameraStarted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<any>(null)
  const lastScannedRef = useRef<string>('')

  useEffect(() => {
    if (cameraStarted) startCamera()
    return () => stopCamera()
  }, [cameraStarted])

  async function startCamera() {
    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser')
      const reader = new BrowserQRCodeReader()
      scannerRef.current = reader

      await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        async (result, err) => {
          if (result && !processing) {
            const code = result.getText()
            if (code === lastScannedRef.current) return
            lastScannedRef.current = code
            await handleScan(code)
            setTimeout(() => { lastScannedRef.current = '' }, 3000)
          }
        }
      )
    } catch (e) {
      console.error('Camera error:', e)
    }
  }

  function stopCamera() {
    if (scannerRef.current) {
      try { scannerRef.current.reset() } catch {}
    }
  }

  async function handleScan(rawCode: string) {
    setProcessing(true)
    setStatus('scanning')

    // Extraire le ticket_code de l'URL ou utiliser directement
    const ticketCode = rawCode.includes('?code=')
      ? rawCode.split('?code=')[1]
      : rawCode

    try {
      const resp = await fetch('/api/bookings/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode, agentName: 'Scanner QR' }),
      })
      const data = await resp.json()

      let newStatus: ScanStatus = 'success'
      if (resp.status === 409) newStatus = 'already'
      else if (resp.status === 404) newStatus = 'invalid'
      else if (!resp.ok) newStatus = 'error'

      const scanResult: ScanResult = {
        status: newStatus,
        booking: data.booking,
        message: data.error,
        timestamp: Date.now(),
      }

      setResult(scanResult)
      setStatus(newStatus)
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)])

      // Vibration
      if (navigator.vibrate) {
        navigator.vibrate(newStatus === 'success' ? [100, 50, 100] : [300])
      }
    } catch {
      setStatus('error')
    } finally {
      setProcessing(false)
      // Reset après 4 secondes
      setTimeout(() => {
        setStatus('idle')
        setResult(null)
      }, 4000)
    }
  }

  if (!cameraStarted) {
    return (
      <div className="md:ml-56 min-h-[calc(100dvh-80px)] flex flex-col items-center justify-center p-5">
        <Camera size={48} className="text-[var(--text-secondary)] mb-6" />
        <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-2">Scanner QR</h1>
        <p className="text-[var(--text-secondary)] text-sm text-center mb-8">
          Activez la caméra pour scanner les tickets d'entrée
        </p>
        <button onClick={() => setCameraStarted(true)} className="btn-cta">
          <Camera size={18} />
          Activer le scanner
        </button>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[status]

  return (
    <div className="md:ml-56">
      {/* Viewfinder */}
      <div className="relative bg-black" style={{ aspectRatio: '1/1', maxHeight: '60dvh' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Overlay cadre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2/3 aspect-square border-2 border-white/30 rounded-2xl relative">
            {/* Coins */}
            {[['top-0 left-0', 'rounded-tl-xl'], ['top-0 right-0', 'rounded-tr-xl'], ['bottom-0 left-0', 'rounded-bl-xl'], ['bottom-0 right-0', 'rounded-br-xl']].map(([pos, round], i) => (
              <div key={i} className={`absolute ${pos} w-6 h-6 border-2 border-white ${round}`} />
            ))}
          </div>
        </div>

        {/* Résultat overlay */}
        <AnimatePresence>
          {result && cfg.bg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 flex flex-col items-center justify-center ${cfg.bg} border-2 ${cfg.border}`}
            >
              <cfg.icon size={56} className={cfg.iconColor} />
              <p className="font-bebas text-2xl text-white mt-3">{cfg.title}</p>
              {result.booking && (
                <div className="text-center mt-2">
                  <p className="font-semibold text-white text-lg">
                    {result.booking.firstName} {result.booking.lastName}
                  </p>
                  <p className="text-white/70 text-sm">{result.booking.activityLabel}</p>
                  <p className="text-white/70 text-sm">
                    {getDayLabel(result.booking.day)} · {formatTime(result.booking.startTime)}
                  </p>
                </div>
              )}
              {result.message && (
                <p className="text-white/70 text-sm mt-1">{result.message}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {processing && !result && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 size={32} className="text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Reset */}
        <button
          onClick={() => { setStatus('idle'); setResult(null); lastScannedRef.current = '' }}
          className="btn-secondary w-full"
        >
          <RotateCcw size={16} />
          Scanner un nouveau ticket
        </button>

        {/* Historique */}
        {scanHistory.length > 0 && (
          <div>
            <p className="text-[var(--text-secondary)] text-xs uppercase tracking-widest mb-3">
              Historique de session
            </p>
            <div className="space-y-2">
              {scanHistory.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  item.status === 'success' ? 'border-green-900/50 bg-green-900/10' :
                  item.status === 'already' ? 'border-yellow-900/50 bg-yellow-900/10' :
                  'border-red-900/50 bg-red-900/10'
                }`}>
                  {item.status === 'success' ? <CheckCircle size={14} className="text-green-400" /> :
                   item.status === 'already' ? <AlertCircle size={14} className="text-yellow-400" /> :
                   <XCircle size={14} className="text-red-400" />}
                  <div className="flex-1 min-w-0">
                    {item.booking ? (
                      <p className="text-[var(--text-primary)] text-sm font-medium">
                        {item.booking.firstName} {item.booking.lastName}
                      </p>
                    ) : (
                      <p className="text-[var(--text-secondary)] text-sm">{item.message || 'Ticket invalide'}</p>
                    )}
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs flex-shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
