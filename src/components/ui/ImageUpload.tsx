'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2, Upload, X } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  hints?: string[];
  onUploadingChange?: (uploading: boolean) => void;
  protectedUrls?: string[];
}

async function deleteUploadedUrl(url: string): Promise<void> {
  const response = await fetch('/api/upload', {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('delete failed');
  }
}

export default function ImageUpload({
  value,
  onChange,
  hints,
  onUploadingChange,
  protectedUrls = [],
}: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadOne = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;

      const previousValue = value;
      setUploading(true);
      onUploadingChange?.(true);
      setProgress(0);
      setError('');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              setProgress(Math.round((event.loaded / event.total) * 100));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText).url);
              } catch {
                reject(new Error('parse error'));
              }
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('network error')));
          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });

        onChange(result);

        if (
          previousValue &&
          previousValue !== result &&
          !protectedUrls.includes(previousValue)
        ) {
          await deleteUploadedUrl(previousValue).catch(() => undefined);
        }
      } catch {
        setError('فشل رفع الصورة');
      } finally {
        setUploading(false);
        onUploadingChange?.(false);
        setProgress(0);
      }
    },
    [onChange, onUploadingChange, protectedUrls, value],
  );

  const clearImage = useCallback(() => {
    const previousValue = value;
    onChange('');

    if (previousValue && !protectedUrls.includes(previousValue)) {
      void deleteUploadedUrl(previousValue).catch(() => undefined);
    }
  }, [onChange, protectedUrls, value]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) {
        void uploadOne(file);
      }
    },
    [uploadOne],
  );

  const onPaste = useCallback(
    (event: React.ClipboardEvent) => {
      const items = event.clipboardData.items;
      for (let index = 0; index < items.length; index += 1) {
        if (items[index].type.startsWith('image/')) {
          const file = items[index].getAsFile();
          if (file) {
            void uploadOne(file);
          }
          break;
        }
      }
    },
    [uploadOne],
  );

  return (
    <div onPaste={onPaste}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.[0]) {
            void uploadOne(event.target.files[0]);
          }
          event.target.value = '';
        }}
      />

      {value && !uploading ? (
        <div className="relative group overflow-hidden rounded-xl border border-border bg-bg-secondary">
          <img src={value} alt="صورة" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-bg-secondary/80 p-2 text-text-primary transition-colors hover:bg-bg-secondary"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="rounded-lg bg-danger/80 p-2 text-white transition-colors hover:bg-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : uploading ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-accent/30 bg-accent/5">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-text-muted">جاري الرفع {progress}%</span>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
            dragging
              ? 'border-accent bg-accent/5'
              : 'border-border bg-bg-secondary hover:border-accent/40'
          }`}
        >
          {error ? (
            <>
              <AlertCircle className="h-8 w-8 text-danger" />
              <p className="text-sm text-danger">{error}</p>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-xs text-accent"
              >
                أعد المحاولة
              </button>
            </>
          ) : (
            <>
              <Upload className={`h-8 w-8 ${dragging ? 'text-accent' : 'text-text-muted'}`} />
              <p className="text-sm text-text-secondary">اضغط أو اسحب الصورة هنا</p>
              <p className="text-xs text-text-muted">Ctrl+V للصق من الحافظة</p>
            </>
          )}
        </div>
      )}

      {hints && hints.length > 0 ? (
        <div className="mt-2 space-y-1 rounded-xl border border-border bg-bg-secondary/50 px-3 py-2">
          {hints.map((hint, index) => (
            <p key={`${hint}-${index}`} className="text-xs text-text-muted">
              {hint}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
