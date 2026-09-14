import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Loader2, RefreshCw, ShieldCheck, SwitchCamera, X } from 'lucide-react'
import {
  CameraCaptureError,
  CameraFacingMode,
  captureCompressedFrame,
  openCameraStream,
  stopCameraStream,
} from '@/lib/camera'

interface CameraCaptureModalProps {
  isOpen: boolean
  action: 'check-in' | 'check-out'
  companyName: string
  submitting: boolean
  submitError: string
  onConfirm: (photo: Blob) => Promise<void> | void
  onCancel: () => void
}

export function CameraCaptureModal({
  isOpen,
  action,
  companyName,
  submitting,
  submitError,
  onConfirm,
  onCancel,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previewUrlRef = useRef('')
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const [facingMode, setFacingMode] = useState<CameraFacingMode>('environment')
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [starting, setStarting] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const releaseCamera = useCallback(() => {
    stopCameraStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraReady(false)
  }, [])

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ''
    setPreviewUrl('')
    setPhoto(null)
  }, [])

  const startCamera = useCallback(
    async (targetMode: CameraFacingMode = facingMode) => {
      releaseCamera()
      setStarting(true)
      setCameraError('')
      try {
        const stream = await openCameraStream(targetMode)
        if (!isOpenRef.current) {
          stopCameraStream(stream)
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) {
          stopCameraStream(stream)
          streamRef.current = null
          throw new CameraCaptureError('Não foi possível preparar a visualização da câmera.')
        }
        video.srcObject = stream
        await video.play()
      } catch (error) {
        releaseCamera()
        setCameraError(
          error instanceof Error
            ? error.message
            : 'Não foi possível iniciar a câmera. Verifique a permissão e tente novamente.',
        )
      } finally {
        setStarting(false)
      }
    },
    [facingMode, releaseCamera],
  )

  const toggleCameraFacing = useCallback(async () => {
    if (isSwitching || starting || capturing || submitting) return
    const nextMode: CameraFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setIsSwitching(true)
    setFacingMode(nextMode)
    try {
      await startCamera(nextMode)
    } finally {
      setIsSwitching(false)
    }
  }, [capturing, facingMode, isSwitching, startCamera, starting, submitting])

  const capture = async () => {
    const video = videoRef.current
    if (!video || capturing) return
    setCapturing(true)
    setCameraError('')
    try {
      const capturedPhoto = await captureCompressedFrame(video, facingMode === 'user')
      releaseCamera()
      clearPreview()
      const objectUrl = URL.createObjectURL(capturedPhoto)
      previewUrlRef.current = objectUrl
      setPreviewUrl(objectUrl)
      setPhoto(capturedPhoto)
    } catch (error) {
      setCameraError(
        error instanceof Error ? error.message : 'Não foi possível tirar a foto. Tente novamente.',
      )
    } finally {
      setCapturing(false)
    }
  }

  const retake = async () => {
    clearPreview()
    await startCamera(facingMode)
  }

  useEffect(() => {
    if (!isOpen) {
      releaseCamera()
      clearPreview()
      setCameraError('')
      setStarting(false)
      setCapturing(false)
      setIsSwitching(false)
      setFacingMode('environment')
    }
  }, [clearPreview, isOpen, releaseCamera])

  useEffect(
    () => () => {
      isOpenRef.current = false
      stopCameraStream(streamRef.current)
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  if (!isOpen) return null

  const label = action === 'check-in' ? 'check-in' : 'check-out'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-title"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="camera-title" className="text-xl font-black text-slate-900">
              Foto obrigatória no {label}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Localização confirmada. Tire uma foto agora para registrar o ponto em{' '}
              <strong className="text-slate-700">{companyName}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            aria-label="Fechar câmera"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Pré-visualização da foto de ${label}`}
              className="max-h-[52dvh] w-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              onCanPlay={() => setCameraReady(true)}
              className={`max-h-[52dvh] w-full object-contain ${streamRef.current ? '' : 'hidden'} ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
          )}

          {!previewUrl && streamRef.current && (
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => void toggleCameraFacing()}
                disabled={starting || isSwitching || capturing || submitting}
                className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                aria-label={`Alternar câmera (atualmente ${facingMode === 'environment' ? 'traseira' : 'frontal'})`}
                title={`Alternar para câmera ${facingMode === 'environment' ? 'frontal' : 'traseira'}`}
              >
                {isSwitching || starting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <SwitchCamera className="h-4 w-4 text-white" />
                )}
                <span>{facingMode === 'environment' ? 'Frontal' : 'Traseira'}</span>
              </button>
            </div>
          )}

          {!previewUrl && !streamRef.current && (
            <div className="flex flex-col items-center px-8 py-12 text-center text-white">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <Camera className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold">Use a câmera deste dispositivo</p>
              <p className="mt-1 text-xs text-slate-300">
                Não é possível selecionar imagens da galeria.
              </p>
            </div>
          )}
        </div>

        {(cameraError || submitError) && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium leading-relaxed text-red-700">
            {submitError || cameraError}
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {!photo && !streamRef.current && (
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={starting || submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 sm:col-span-2"
            >
              {starting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
              Abrir câmera
            </button>
          )}

          {!photo && streamRef.current && (
            <button
              type="button"
              onClick={() => void capture()}
              disabled={!cameraReady || capturing || submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 sm:col-span-2"
            >
              {capturing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
              Tirar foto
            </button>
          )}

          {photo && (
            <>
              <button
                type="button"
                onClick={() => void retake()}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Tirar novamente
              </button>
              <button
                type="button"
                onClick={() => void onConfirm(photo)}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Usar foto
              </button>
            </>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          A foto será enviada somente ao confirmar e não será salva neste dispositivo.
        </p>
      </div>
    </div>
  )
}
