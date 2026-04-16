import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Loader2, FileIcon, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  bucket?: string;
  folder?: string;
  accept?: string;
  maxSizeMb?: number;
  onUploaded: (url: string, fileName: string) => void;
  label?: string;
  existingUrl?: string;
  onRemove?: () => void;
}

export default function FileUpload({
  bucket = "documents",
  folder = "uploads",
  accept = "*/*",
  maxSizeMb = 10,
  onUploaded,
  label = "Attach file",
  existingUrl,
  onRemove,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    existingUrl ? { url: existingUrl, name: existingUrl.split("/").pop() ?? "file" } : null
  );

  const isImage = (name: string) => /\.(jpe?g|png|gif|webp|svg)$/i.test(name);

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`File must be under ${maxSizeMb}MB`);
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    setUploading(false);

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data.publicUrl;
    setPreview({ url: publicUrl, name: file.name });
    onUploaded(publicUrl, file.name);
    toast.success("File uploaded");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  };

  if (preview) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        {isImage(preview.name) ? (
          <img src={preview.url} alt={preview.name} className="h-10 w-10 rounded object-cover" />
        ) : (
          <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{preview.name}</p>
          <a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
            View file
          </a>
        </div>
        <button onClick={handleRemove} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      {uploading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading…
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-center">
            {accept.includes("image") ? (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Paperclip className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {label} — drag & drop or <span className="text-primary font-medium">click to browse</span>
          </p>
          <p className="text-xs text-muted-foreground">Max {maxSizeMb}MB</p>
        </div>
      )}
    </div>
  );
}
