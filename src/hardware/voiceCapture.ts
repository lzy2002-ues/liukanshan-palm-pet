export interface VoiceCapture {
  start(): void;
  stop(): Promise<Blob>;
  cancel(): void;
}

// Browser-only stand-in. ESP32 firmware owns microphone recording and uploads real audio.
export const mockVoiceCapture: VoiceCapture = {
  start() {},
  async stop() { return new Blob([new Uint8Array(1)], { type: "audio/wav" }); },
  cancel() {},
};
