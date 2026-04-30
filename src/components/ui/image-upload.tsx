"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  shape?: "circle" | "square";
  size?: "sm" | "md" | "lg";
  fallback?: string;
  className?: string;
};

const SIZE_CLASSES = {
  sm: "w-16 h-16",
  md: "w-20 h-20",
  lg: "w-28 h-28",
};

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  shape = "circle",
  size = "md",
  fallback = "?",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadErr) {
      toast.error("Erreur upload : " + uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    onChange(publicUrl);
    setUploading(false);
    toast.success("Image uploadée");
  }

  async function handleRemove() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const sizeClass = SIZE_CLASSES[size];
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className={cn("relative shrink-0", sizeClass)}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className={cn("w-full h-full object-cover", radiusClass, "ring-2 ring-orange-500/30")}
          />
        ) : (
          <div className={cn("w-full h-full gradient-mood flex items-center justify-center text-white font-bold text-xl", radiusClass)}>
            {fallback.charAt(0).toUpperCase()}
          </div>
        )}
        {uploading && (
          <div className={cn("absolute inset-0 bg-black/60 flex items-center justify-center", radiusClass)}>
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold glass glass-hover text-white disabled:opacity-50 transition-all"
        >
          {value ? <Upload className="w-3.5 h-3.5" /> : <ImagePlus className="w-3.5 h-3.5" />}
          {value ? "Changer" : "Uploader une image"}
        </button>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium text-white/50 hover:text-rose-300 transition-colors self-start"
          >
            <X className="w-3 h-3" /> Retirer
          </button>
        )}
        <p className="text-[10px] text-white/40">JPG, PNG, GIF — max 5 Mo</p>
      </div>
    </div>
  );
}
