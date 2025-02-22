import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { Button } from "@midday/ui/button";
import { Mic, Pause, Play, Square } from "lucide-react";

export function VoiceRecorderModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (audioBlob: Blob) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setAudioURL(null);
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Set up audio context and analyser
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      drawAudioWaveform();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const drawAudioWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / bufferLength;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(20, 20, 20)';
      ctx.fillRect(0, 0, width, height);

      dataArray.forEach((value, i) => {
        const barHeight = (value / 255) * height;
        const x = i * barWidth;
        const hue = (i / bufferLength) * 120 + 120; // Green spectrum
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      });
    };

    draw();
  };

  const handleSave = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      onSave(audioBlob);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center gap-4 p-4">
          <canvas
            ref={canvasRef}
            width={380}
            height={100}
            className="bg-[rgb(20,20,20)] rounded-lg"
          />
          
          <div className="flex gap-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                variant="outline"
                size="icon"
                className="w-12 h-12"
              >
                <Mic className="h-6 w-6" />
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button
                    onClick={resumeRecording}
                    variant="outline"
                    size="icon"
                    className="w-12 h-12"
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                ) : (
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    size="icon"
                    className="w-12 h-12"
                  >
                    <Pause className="h-6 w-6" />
                  </Button>
                )}
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  size="icon"
                  className="w-12 h-12"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {audioURL && (
            <div className="w-full">
              <audio src={audioURL} controls className="w-full" />
              <Button
                onClick={handleSave}
                className="w-full mt-4"
              >
                Save Recording
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
