declare module '@mediapipe/tasks-vision' {
  type Delegate = 'CPU' | 'GPU'

  interface BaseOptions {
    modelAssetPath: string
    delegate?: Delegate
  }

  export interface NormalizedLandmark {
    x: number
    y: number
    z?: number
    visibility?: number
  }

  export interface FaceLandmarkerResult {
    faceLandmarks?: NormalizedLandmark[][]
  }

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<FilesetResolver>
  }

  export interface FaceLandmarkerOptions {
    baseOptions: BaseOptions
    runningMode?: 'IMAGE' | 'VIDEO'
    numFaces?: number
  }

  export class FaceLandmarker {
    static createFromOptions(resolver: FilesetResolver, options: FaceLandmarkerOptions): Promise<FaceLandmarker>
    detectForVideo(
      videoFrame: HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas | HTMLImageElement | ImageBitmap | VideoFrame,
      timestamp: number
    ): FaceLandmarkerResult
    close(): void
  }
}