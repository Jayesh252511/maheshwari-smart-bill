import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AIVoiceAssistantProps {
  onAddItems?: (items: { name: string; quantity: number }[]) => void;
  onSelectCustomer?: (customerName: string) => void;
}

const AIVoiceAssistant: React.FC<AIVoiceAssistantProps> = ({ 
  onAddItems, 
  onSelectCustomer 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      setIsSpeaking(true);
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Listening...",
        description: "Speak your billing command",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording]);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Send to voice-to-text
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions
        .invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

      if (transcriptionError) throw transcriptionError;
      
      const transcribedText = transcriptionData.text;
      console.log('Transcribed:', transcribedText);
      
      // Send to AI for processing
      const { data: aiData, error: aiError } = await supabase.functions
        .invoke('ai-chat', {
          body: { 
            message: transcribedText,
            type: 'voice_billing',
            userId: user?.id
          }
        });

      if (aiError) throw aiError;
      
      setLastCommand(transcribedText);
      
      // Handle AI response
      if (aiData.action === 'add_items' && aiData.items && onAddItems) {
        onAddItems(aiData.items);
      }
      
      if (aiData.customer && onSelectCustomer) {
        onSelectCustomer(aiData.customer);
      }
      
      // Generate speech response
      const { data: speechData, error: speechError } = await supabase.functions
        .invoke('text-to-speech', {
          body: { text: aiData.response }
        });

      if (!speechError && speechData.audioContent) {
        await playAudio(speechData.audioContent);
      }
      
      toast({
        title: "Command Processed",
        description: aiData.response,
      });
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: "Could not process voice command",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, onAddItems, onSelectCustomer, playAudio, toast]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          AI Voice Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isSpeaking}
            className="w-24 h-24 rounded-full"
          >
            {isRecording ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        </div>
        
        <div className="text-center space-y-2">
          {isRecording && (
            <Badge variant="destructive">Recording...</Badge>
          )}
          {isProcessing && (
            <Badge variant="secondary">Processing...</Badge>
          )}
          {isSpeaking && (
            <Badge variant="default" className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Speaking...
            </Badge>
          )}
        </div>
        
        {lastCommand && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground mb-1">Last command:</p>
            <p className="text-sm font-medium">{lastCommand}</p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          <p>Try saying:</p>
          <p>"Add 5 apples" or "Add 3 coffees for John"</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIVoiceAssistant;