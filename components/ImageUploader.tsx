"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

export type SampleKey = "high" | "moderate";

interface ImageUploaderProps {
  previewUrl: string | null;
  onImageReady: (payload: {
    base64: string;
    mimeType: string;
    previewUrl: string;
    sampleKey: SampleKey | null;
  }) => void;
  onClear: () => void;
  disabled?: boolean;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read error"));
    reader.readAsDataURL(file);
  });
}

async function urlToBase64(url: string): Promise<{
  base64: string;
  mimeType: string;
  previewUrl: string;
}> {
  const response = await fetch(url);
  const blob = await response.blob();
  const mimeType = blob.type || "image/svg+xml";
  const base64 = await fileToBase64(new File([blob], "sample.svg", { type: mimeType }));
  return { base64, mimeType, previewUrl: url };
}

export function ImageUploader({
  previewUrl,
  onImageReady,
  onClear,
  disabled = false,
}: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState<SampleKey | null>(null);

  const acceptFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const base64 = await fileToBase64(file);
      const objectUrl = URL.createObjectURL(file);
      onImageReady({
        base64,
        mimeType: file.type,
        previewUrl: objectUrl,
        sampleKey: null,
      });
    },
    [onImageReady],
  );

  const loadSample = useCallback(
    async (key: SampleKey) => {
      setLoadingSample(key);
      try {
        const path =
          key === "high"
            ? "/samples/sample-high-risk.svg"
            : "/samples/sample-moderate-risk.svg";
        const { base64, mimeType, previewUrl: url } = await urlToBase64(path);
        onImageReady({
          base64,
          mimeType,
          previewUrl: url,
          sampleKey: key,
        });
      } finally {
        setLoadingSample(null);
      }
    },
    [onImageReady],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          if (file) void acceptFile(file);
        }}
        className={cn(
          "relative flex min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition",
          dragging
            ? "border-cyan-400 bg-cyan-400/10"
            : "border-slate-700 bg-[#0B1220]",
          disabled && "opacity-60",
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Prescription preview"
            className="max-h-56 w-auto rounded-md border border-slate-700 object-contain shadow-lg"
          />
        ) : (
          <>
            <Upload className="mb-3 h-10 w-10 text-cyan-400" />
            <p className="text-center text-sm font-medium text-slate-100">
              Drop prescription image here
            </p>
            <p className="mt-1 text-center text-xs text-slate-400">
              PNG, JPEG, or WebP
            </p>
          </>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void acceptFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
          Select Image
        </button>
        {previewUrl && (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear Image
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Quick-load demo samples
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={disabled || loadingSample !== null}
            onClick={() => void loadSample("high")}
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-left text-sm text-red-100 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            <span className="font-semibold">Sample 1 — High Risk</span>
            <span className="mt-1 block text-xs text-red-200/80">
              Warfarin + Aspirin + Ibuprofen
            </span>
          </button>
          <button
            type="button"
            disabled={disabled || loadingSample !== null}
            onClick={() => void loadSample("moderate")}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-left text-sm text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
          >
            <span className="font-semibold">Sample 2 — Moderate Risk</span>
            <span className="mt-1 block text-xs text-amber-200/80">
              Metformin + Ciprofloxacin
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
