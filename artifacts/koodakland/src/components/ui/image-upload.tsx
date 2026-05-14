import { useRef, useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  status: "uploading" | "done" | "error";
}

interface ImageUploadProps {
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
  label?: string;
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url as string;
}

export function ImageUpload({ value = [], onChange, maxFiles = 5, accept = "image/*", className = "", label = "آپلود تصویر" }: ImageUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(() =>
    value.map((url, i) => ({ id: `init-${i}`, url, name: url.split("/").pop() || "image", status: "done" as const }))
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: File[]) => {
    const toUpload = fileList.slice(0, maxFiles - files.length);
    if (toUpload.length === 0) return;

    const pending: UploadedFile[] = toUpload.map(f => ({
      id: `${Date.now()}-${f.name}`,
      url: URL.createObjectURL(f),
      name: f.name,
      status: "uploading" as const,
    }));
    setFiles(prev => [...prev, ...pending]);

    const updated = [...files];
    for (const [i, file] of toUpload.entries()) {
      try {
        const url = await uploadFile(file);
        pending[i].url = url;
        pending[i].status = "done";
      } catch {
        pending[i].status = "error";
      }
      setFiles(prev => {
        const next = prev.map(f => f.id === pending[i].id ? { ...pending[i] } : f);
        const done = next.filter(f => f.status === "done").map(f => f.url);
        onChange?.(done);
        return next;
      });
      updated.push(pending[i]);
    }
  }, [files, maxFiles, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    processFiles(dropped);
  }, [processFiles]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const remove = (id: string) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      onChange?.(next.filter(f => f.status === "done").map(f => f.url));
      return next;
    });
  };

  const canAdd = files.length < maxFiles;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {canAdd && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none
            ${dragging
              ? "border-primary bg-pink-50 scale-[1.01] shadow-lg shadow-primary/10"
              : "border-pink-200 bg-pink-50/40 hover:border-primary/60 hover:bg-pink-50 hover:shadow-sm"
            }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragging ? "bg-primary/20" : "bg-pink-100"}`}>
            <Upload className={`w-6 h-6 transition-colors ${dragging ? "text-primary" : "text-pink-400"}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">فایل را اینجا رها کنید یا کلیک کنید</p>
            <p className="text-xs text-muted-foreground">PNG، JPG، WEBP — حداکثر ۵ مگابایت</p>
          </div>
          {files.length > 0 && (
            <p className="text-xs text-muted-foreground">{files.length} از {maxFiles} فایل</p>
          )}
          <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={handleInput} />
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {files.map(f => (
            <div key={f.id} className="relative group aspect-square rounded-xl overflow-hidden bg-pink-50 border border-pink-100">
              {f.url && f.status !== "error" ? (
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-pink-200" />
                </div>
              )}

              {f.status === "uploading" && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              {f.status === "done" && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
              {f.status === "error" && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              )}

              {f.status !== "uploading" && (
                <button
                  onClick={e => { e.stopPropagation(); remove(f.id); }}
                  className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
