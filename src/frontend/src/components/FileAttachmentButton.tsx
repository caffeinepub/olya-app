import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileImage, FileText, FileType, Paperclip } from "lucide-react";
import { useRef } from "react";

export interface AttachedFileInfo {
  name: string;
  type: string;
  content: string;
  preview?: string; // dataURL for images, text snippet for docs
  isImage?: boolean;
}

interface FileAttachmentButtonProps {
  onFileAttached: (info: AttachedFileInfo) => void;
  disabled?: boolean;
}

const ACCEPT_MAP = {
  document: ".pdf,.doc,.docx,.txt,.rtf",
  image: "image/*",
  text: ".txt,.csv,.md,.json,.xml",
};

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function FileAttachmentButton({
  onFileAttached,
  disabled,
}: FileAttachmentButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptRef = useRef<string>("");

  const openPicker = (accept: string) => {
    acceptRef.current = accept;
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";
    const isDoc =
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    try {
      if (isImage) {
        const dataUrl = await readFileAsDataURL(file);
        onFileAttached({
          name: file.name,
          type: "image",
          content: `[Image attached: ${file.name}]\nImage data: ${dataUrl.substring(0, 80)}...`,
          preview: dataUrl,
          isImage: true,
        });
      } else if (isPDF) {
        const text = await readFileAsText(file);
        const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
        const content =
          cleaned.length > 20
            ? cleaned
            : `[PDF attached: ${file.name} — binary content, please use a text layer PDF]`;
        onFileAttached({
          name: file.name,
          type: "pdf",
          content,
          preview: content.substring(0, 300),
          isImage: false,
        });
      } else if (isDoc) {
        const content = `[Word document attached: ${file.name} — content extraction requires server-side processing]`;
        onFileAttached({
          name: file.name,
          type: "document",
          content,
          preview: content,
          isImage: false,
        });
      } else {
        const text = await readFileAsText(file);
        onFileAttached({
          name: file.name,
          type: "text",
          content: text,
          preview: text.substring(0, 300),
          isImage: false,
        });
      }
    } catch {
      onFileAttached({
        name: file.name,
        type: "error",
        content: `[Failed to read file: ${file.name}]`,
        isImage: false,
      });
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={disabled}
            title="Attach file for analysis"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs">
            Attach for Analysis
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-xs cursor-pointer"
            onClick={() => openPicker(ACCEPT_MAP.document)}
          >
            <FileType className="w-4 h-4 mr-2 text-red-500" />
            PDF / Word Document
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs cursor-pointer"
            onClick={() => openPicker(ACCEPT_MAP.text)}
          >
            <FileText className="w-4 h-4 mr-2 text-blue-500" />
            Text / CSV / Markdown
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-xs cursor-pointer"
            onClick={() => openPicker(ACCEPT_MAP.image)}
          >
            <FileImage className="w-4 h-4 mr-2 text-green-500" />
            Picture / Image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
