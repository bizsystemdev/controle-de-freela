const MAX_IMAGE_DIMENSION = 1280
const TARGET_IMAGE_BYTES = 1400 * 1024

export class CameraCaptureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CameraCaptureError'
  }
}

export function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : ''

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'A permissão da câmera foi negada. Libere o acesso nas configurações do navegador para continuar.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Nenhuma câmera foi encontrada neste dispositivo. A fotografia é obrigatória para continuar.'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'A câmera está ocupada ou indisponível. Feche outros aplicativos que estejam usando a câmera e tente novamente.'
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'Não foi possível iniciar uma câmera compatível neste dispositivo.'
  }

  return 'Não foi possível iniciar a câmera. Verifique a permissão do navegador e tente novamente.'
}

export async function openCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraCaptureError(
      'Este navegador não oferece suporte à câmera. A fotografia é obrigatória para continuar.',
    )
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: MAX_IMAGE_DIMENSION },
        height: { ideal: 960 },
      },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'OverconstrainedError') {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
      } catch (fallbackError) {
        throw new CameraCaptureError(cameraErrorMessage(fallbackError))
      }
    }
    throw new CameraCaptureError(cameraErrorMessage(error))
  }
}

export function stopCameraStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else
          reject(
            new CameraCaptureError('Não foi possível processar a fotografia. Tente novamente.'),
          )
      },
      'image/jpeg',
      quality,
    )
  })
}

export async function captureCompressedFrame(video: HTMLVideoElement): Promise<Blob> {
  if (!video.videoWidth || !video.videoHeight) {
    throw new CameraCaptureError(
      'A câmera ainda está iniciando. Aguarde um instante e tente novamente.',
    )
  }

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(video.videoWidth, video.videoHeight))
  let canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale))

  const context = canvas.getContext('2d')
  if (!context) {
    throw new CameraCaptureError('Não foi possível processar a fotografia. Tente novamente.')
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  try {
    let blob = await canvasToJpeg(canvas, 0.78)
    if (blob.size > TARGET_IMAGE_BYTES) blob = await canvasToJpeg(canvas, 0.65)
    if (blob.size > TARGET_IMAGE_BYTES) blob = await canvasToJpeg(canvas, 0.52)

    while (blob.size > TARGET_IMAGE_BYTES && Math.max(canvas.width, canvas.height) > 640) {
      const smallerCanvas = document.createElement('canvas')
      smallerCanvas.width = Math.max(1, Math.round(canvas.width * 0.8))
      smallerCanvas.height = Math.max(1, Math.round(canvas.height * 0.8))
      const smallerContext = smallerCanvas.getContext('2d')
      if (!smallerContext) break
      smallerContext.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height)
      canvas.width = 0
      canvas.height = 0
      canvas = smallerCanvas
      blob = await canvasToJpeg(canvas, 0.65)
    }

    return blob
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}
