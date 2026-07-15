import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage, extractPathFromUrl, deleteImage } from "@/lib/supabase-upload";
import { Upload, X, Loader2, ImageIcon, Trash2 } from "lucide-react";

type BucketType = "properties" | "blogs" | "communities";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  type: BucketType;
  label?: string;
  folder?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  type,
  label = "Image",
  folder,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file (JPG, PNG, WebP)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be under 10MB");
        return;
      }

      setUploading(true);
      setError(null);

      const { url, error: uploadError } = await uploadImage(file, type, folder);

      if (uploadError) {
        setError(uploadError);
      } else {
        onChange(url);
      }

      setUploading(false);
    },
    [type, folder, onChange]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemove = useCallback(async () => {
    if (value) {
      const path = extractPathFromUrl(value, type);
      if (path) await deleteImage(path, type);
    }
    onChange("");
  }, [value, type, onChange]);

  if (value) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{label}</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
          </Button>
        </div>
        <div className="relative rounded-lg border overflow-hidden bg-gray-50">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-48 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%23f3f4f6' width='400' height='200'/%3E%3Ctext fill='%239ca3af' x='200' y='100' text-anchor='middle' font-size='14'%3EInvalid Image%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
        <p className="text-xs text-gray-400 truncate">{value}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-colors text-center
          ${dragOver
            ? "border-[#1E3A5F] bg-[#1E3A5F]/5"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-[#1E3A5F] animate-spin" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, WebP up to 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>
      )}
    </div>
  );
}

/**
 * Multi-image gallery upload component
 */
interface GalleryUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  type: BucketType;
  label?: string;
}

export function GalleryUpload({ images, onChange, type, label = "Gallery" }: GalleryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      const { url } = await uploadImage(file, type, "gallery");
      if (url) newUrls.push(url);
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }
    setUploading(false);
  };

  const removeImage = async (idx: number) => {
    const url = images[idx];
    const path = extractPathFromUrl(url, type);
    if (path) await deleteImage(path, type);
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1" />
          )}
          {uploading ? "Uploading..." : "Add Images"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-24 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='80'%3E%3Crect fill='%23f3f4f6' width='100' height='80'/%3E%3Ctext fill='%239ca3af' x='50' y='40' text-anchor='middle' font-size='10'%3EInvalid%3C/text%3E%3C/svg%3E";
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-gray-400">
          <ImageIcon className="h-8 w-8 mb-2" />
          <p className="text-sm">No gallery images yet</p>
          <p className="text-xs">Click "Add Images" to upload</p>
        </div>
      )}
    </div>
  );
}
