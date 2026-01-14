export class AudioProcessingService {
  private recognition: any = null;
  private isListening: boolean = false;
  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];

  constructor() {
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize Web Speech API for speech-to-text
   */
  private initializeSpeechRecognition(): void {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)
      this.recognition.maxAlternatives = 3;

      // Enhanced Arabic language model
      this.recognition.serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/recognize';
    }
  }

  /**
   * Check if browser supports speech recognition
   */
  isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && 
           ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  /**
   * Start speech recognition with Arabic language support
   */
  async startSpeechRecognition(
    onResult: (transcript: string, confidence: number, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.isSpeechRecognitionSupported()) {
      throw new Error('Speech recognition not supported in this browser');
    }

    if (this.isListening) {
      throw new Error('Speech recognition already active');
    }

    try {
      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, 0.9, true);
        } else if (interimTranscript) {
          onResult(interimTranscript, 0.7, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone access denied';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied';
            break;
          case 'network':
            errorMessage = 'Network error';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service unavailable';
            break;
        }
        
        onError(errorMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      throw new Error(`Failed to start speech recognition: ${error}`);
    }
  }

  /**
   * Stop speech recognition
   */
  stopSpeechRecognition(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      throw new Error('Already recording');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * Stop recording and get audio blob
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('Not currently recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Convert audio blob to base64
   */
  async audioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Process audio file with enhancement
   */
  async processAudioFile(audioFile: File): Promise<{
    processedBlob: Blob;
    duration: number;
    sampleRate: number;
    channels: number;
  }> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Apply audio processing (noise reduction, normalization)
      const processedBuffer = await this.enhanceAudio(audioContext, audioBuffer);

      // Convert back to blob
      const processedBlob = await this.audioBufferToBlob(processedBuffer, audioFile.type);

      return {
        processedBlob,
        duration: processedBuffer.duration,
        sampleRate: processedBuffer.sampleRate,
        channels: processedBuffer.numberOfChannels
      };
    } catch (error) {
      throw new Error(`Audio processing failed: ${error}`);
    }
  }

  /**
   * Enhance audio quality
   */
  private async enhanceAudio(
    audioContext: AudioContext,
    audioBuffer: AudioBuffer
  ): Promise<AudioBuffer> {
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Create source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Create gain node for normalization
    const gainNode = offlineContext.createGain();
    
    // Create compressor for dynamic range
    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Create filter for noise reduction
    const filter = offlineContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8000;
    filter.Q.value = 1;

    // Connect nodes
    source.connect(filter);
    filter.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    // Calculate normalization gain
    const maxAmplitude = Math.max(...audioBuffer.getChannelData(0).map(Math.abs));
    const normalizationGain = maxAmplitude > 0 ? 0.8 / maxAmplitude : 1;
    gainNode.gain.value = normalizationGain;

    // Start processing
    source.start(0);

    return await offlineContext.startRendering();
  }

  /**
   * Convert AudioBuffer to Blob
   */
  private async audioBufferToBlob(audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> {
    const length = audioBuffer.length * audioBuffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // file length
    setUint32(36 + length);
    // WAVE identifier
    setUint32(0x45564157);
    // fmt chunk identifier
    setUint32(0x20746d66);
    // chunk length
    setUint32(16);
    // sample format (PCM)
    setUint16(1);
    // channel count
    setUint16(audioBuffer.numberOfChannels);
    // sample rate
    setUint32(audioBuffer.sampleRate);
    // byte rate
    setUint32(audioBuffer.sampleRate * 2 * audioBuffer.numberOfChannels);
    // block align
    setUint16(audioBuffer.numberOfChannels * 2);
    // bits per sample
    setUint16(16);
    // data chunk identifier
    setUint32(0x61746164);
    // data chunk length
    setUint32(length);

    // Write interleaved data
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (offset < audioBuffer.length) {
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(44 + pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Get audio duration from file
   */
  async getAudioDuration(audioFile: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => {
        reject(new Error('Failed to load audio metadata'));
        URL.revokeObjectURL(audio.src);
      };
      audio.src = URL.createObjectURL(audioFile);
    });
  }

  /**
   * Check microphone permission
   */
  async checkMicrophonePermission(): Promise<{
    granted: boolean;
    canPrompt: boolean;
  }> {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return {
        granted: permission.state === 'granted',
        canPrompt: permission.state !== 'denied'
      };
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true, canPrompt: true };
      } catch (err) {
        return { granted: false, canPrompt: false };
      }
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopSpeechRecognition();
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.audioChunks = [];
  }
}

// Export singleton instance
let audioService: AudioProcessingService | null = null;

export function getAudioService(): AudioProcessingService {
  if (!audioService) {
    audioService = new AudioProcessingService();
  }
  return audioService;
}