import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Radio, Send, X } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useAsrEnginePreference } from "../hooks/useAsrEnginePreference";
import type { SpeakerRole } from "../hooks/useDashboardState";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { detectLanguage } from "../utils/languageDetector";
import FileAttachmentButton, {
  type AttachedFileInfo,
} from "./FileAttachmentButton";

type AsrEngine = "webSpeech" | "whisper" | "deepspeech";

interface TranscriptInputProps {
  onAddEntry: (
    text: string,
    speaker: SpeakerRole,
    detectedLanguage?: string,
  ) => void;
  onAsrEngineChange?: (engine: AsrEngine) => void;
  disabled?: boolean;
}

const SPEAKER_OPTIONS: SpeakerRole[] = [
  "Operator",
  "Subject",
  "Witness",
  "Unknown",
];

const ENGINE_LABELS: Record<AsrEngine, string> = {
  webSpeech: "Web Speech API",
  whisper: "Whisper",
  deepspeech: "DeepSpeech",
};

const ENGINE_COLORS: Record<AsrEngine, string> = {
  webSpeech: "bg-green-500",
  whisper: "bg-blue-500",
  deepspeech: "bg-purple-500",
};

export default function TranscriptInput({
  onAddEntry,
  onAsrEngineChange,
  disabled,
}: TranscriptInputProps) {
  const [text, setText] = useState("");
  const [speaker, setSpeaker] = useState<SpeakerRole>("Operator");
  const [attachedFile, setAttachedFile] = useState<AttachedFileInfo | null>(
    null,
  );
  const { asrEngine, setAsrEngine } = useAsrEnginePreference();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isListening, startListening, stopListening, processingStatus } =
    useSpeechRecognition({
      asrEngine,
      onFinalResult: (transcript: string) => {
        const detectedLang = detectLanguage(transcript);
        onAddEntry(transcript, speaker, detectedLang);
      },
    });

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const detectedLang = detectLanguage(trimmed);
    onAddEntry(trimmed, speaker, detectedLang);
    setText("");
    setAttachedFile(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEngineChange = (engine: AsrEngine) => {
    setAsrEngine(engine);
    onAsrEngineChange?.(engine);
  };

  const handleFileAttached = (info: AttachedFileInfo) => {
    setAttachedFile(info);
    setText(info.content);
    textareaRef.current?.focus();
  };

  const clearAttachment = () => {
    setAttachedFile(null);
    setText("");
  };

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Speaker selector */}
        <Select
          value={speaker}
          onValueChange={(v) => setSpeaker(v as SpeakerRole)}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEAKER_OPTIONS.map((role) => (
              <SelectItem key={role} value={role} className="text-xs">
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ASR Engine selector */}
        <Select
          value={asrEngine}
          onValueChange={(v) => handleEngineChange(v as AsrEngine)}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ENGINE_LABELS) as AsrEngine[]).map((engine) => (
              <SelectItem key={engine} value={engine} className="text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${ENGINE_COLORS[engine]}`}
                  />
                  {ENGINE_LABELS[engine]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Recording status */}
        {isListening && (
          <Badge
            variant="destructive"
            className="text-xs flex items-center gap-1 animate-pulse"
          >
            <Radio className="w-3 h-3" />
            Recording
          </Badge>
        )}
        {processingStatus && !isListening && (
          <Badge variant="secondary" className="text-xs">
            {processingStatus}
          </Badge>
        )}
      </div>

      {/* File preview panel */}
      {attachedFile && (
        <div className="relative rounded-md border bg-muted/40 p-2">
          <button
            type="button"
            onClick={clearAttachment}
            className="absolute top-1 right-1 rounded-full p-0.5 hover:bg-muted"
            title="Remove attachment"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="text-xs font-medium text-muted-foreground mb-1 pr-5 truncate">
            {attachedFile.name}
          </p>
          {attachedFile.isImage && attachedFile.preview ? (
            <img
              src={attachedFile.preview}
              alt={attachedFile.name}
              className="max-h-40 max-w-full rounded object-contain"
            />
          ) : attachedFile.preview ? (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
              {attachedFile.preview}
            </p>
          ) : null}
        </div>
      )}

      {/* Text input row */}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type transcript or use microphone... (Enter to submit)"
          className="min-h-[60px] max-h-32 resize-none text-sm flex-1"
          disabled={disabled || isListening}
        />
        <div className="flex flex-col gap-2">
          <Button
            size="icon"
            variant={isListening ? "destructive" : "outline"}
            className="h-8 w-8"
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            title={isListening ? "Stop recording" : "Start recording"}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <FileAttachmentButton
            onFileAttached={handleFileAttached}
            disabled={disabled || isListening}
          />
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={handleSubmit}
            disabled={disabled || !text.trim()}
            title="Submit"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
