'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, ImagePlus, GripVertical, Loader2, AlertCircle } from 'lucide-react';

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
  hints?: string[];
}

async function uploadFile(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
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
}

function getPreview(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

export default function MultiImageUpload({
  value,
  onChange,
  max = 8,
  hints,
}: MultiImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingImage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalImages = value.length + uploading.filter(u => u.status === 'uploading').length;
  const canAdd = totalImages < max;

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const remaining = max - value.length;
    const toProcess = imageFiles.slice(0, remaining);
    if (toProcess.length === 0) return;

    const entries: UploadingImage[] = await Promise.all(
      toProcess.map(async (file) => {
        const preview = await getPreview(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview,
          status: 'uploading' as const,
          progress: 0,
        };
      })
    );

    setUploading(prev => [...prev, ...entries]);

    for (const entry of entries) {
      try {
        const url = await uploadFile(entry.file, (pct) => {
          setUploading(prev =>
            prev.map(u => u.id === entry.id ? { ...u, progress: pct } : u)
          );
        });

        setUploading(prev =>
          prev.map(u => u.id === entry.id ? { ...u, status: 'done', url } : u)
        );

        onChange([...value, url]);
      } catch {
        setUploading(prev =>
          prev.map(u => u.id === entry.id ? { ...u, status: 'error', error: 'فشل الرفع' } : u)
        );
      }
    }

    setUploading(prev => prev.filter(u => u.status === 'error'));
  }, [value, onChange, max]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) handleFiles(imageFiles);
  }, [handleFiles]);

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    const newImages = [...value];
    const [moved] = newImages.splice(index, 1);
    newImages.unshift(moved);
    onChange(newImages);
  };

  const removeUploading = (id: string) => {
    setUploading(prev => prev.filter(u => u.id !== id));
  };

  const retryUpload = (entry: UploadingImage) => {
    setUploading(prev => prev.filter(u => u.id !== entry.id));
    handleFiles([entry.file]);
  };

  return (
    <div onPaste={onPaste} className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) { handleFiles(e.target.files); e.target.value = ''; } }}
      />

      {(value.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((img, idx) => (
            <div key={`v-${idx}`} className={`relative group rounded-xl overflow-hidden border-2 transition-all ${idx === 0 ? 'border-accent col-span-2 row-span-2' : 'border-border'}`}>
              <img
                src={img}
                alt={`صورة ${idx + 1}`}
                className={`w-full object-cover bg-bg-secondary ${idx === 0 ? 'h-48' : 'h-24'}`}
              />
              {idx === 0 && (
                <span className="absolute top-1.5 right-1.5 text-[10px] bg-accent text-white px-1.5 py-0.5 rounded-md font-medium shadow">
                  الرئيسية
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsPrimary(idx)}
                    title="تعيين كصورة رئيسية"
                    className="p-1.5 rounded-lg bg-accent/80 text-white hover:bg-accent transition-colors"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="p-1.5 rounded-lg bg-danger/80 text-white hover:bg-danger transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {uploading.map(entry => (
            <div key={entry.id} className="relative rounded-xl overflow-hidden border-2 border-border">
              <img src={entry.preview} alt="" className="w-full h-24 object-cover bg-bg-secondary" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                {entry.status === 'uploading' && (
                  <>
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    <div className="w-12 h-1 bg-bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-200" style={{ width: `${entry.progress}%` }} />
                    </div>
                    <span className="text-[9px] text-white">{entry.progress}%</span>
                  </>
                )}
                {entry.status === 'error' && (
                  <button type="button" onClick={() => retryUpload(entry)} className="flex flex-col items-center gap-1">
                    <AlertCircle className="w-5 h-5 text-danger" />
                    <span className="text-[9px] text-danger">أعد المحاولة</span>
                  </button>
                )}
              </div>
              {entry.status === 'error' && (
                <button
                  type="button"
                  onClick={() => removeUploading(entry.id)}
                  className="absolute top-1 left-1 p-0.5 rounded bg-danger/80 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {canAdd && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-24 rounded-xl border-2 border-dashed border-border bg-bg-secondary hover:border-accent/40 hover:bg-bg-secondary/80 flex flex-col items-center justify-center gap-1 transition-all"
            >
              <ImagePlus className="w-5 h-5 text-text-muted" />
              <span className="text-[10px] text-text-muted">إضافة</span>
            </button>
          )}
        </div>
      )}

      {value.length === 0 && uploading.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all h-40 ${
            dragging ? 'border-accent bg-accent/5' : 'border-border bg-bg-secondary hover:border-accent/40 hover:bg-bg-secondary/80'
          }`}
        >
          <Upload className={`w-8 h-8 ${dragging ? 'text-accent' : 'text-text-muted'}`} />
          <p className="text-sm text-text-secondary">اضغط أو اسحب الصور هنا</p>
          <p className="text-xs text-text-muted">يمكنك رفع حتى {max} صور • Ctrl+V للصق</p>
        </div>
      )}

      {(value.length > 0 || uploading.length > 0) && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {value.length} / {max} صور
            {uploading.length > 0 && ` • جاري رفع ${uploading.length}...`}
          </p>
          <button
            type="button"
            onClick={() => { onChange([]); setUploading([]); }}
            className="text-xs text-danger hover:text-danger/80 transition-colors"
          >
            حذف الكل
          </button>
        </div>
      )}

      {hints && hints.length > 0 ? (
        <div className="space-y-1 rounded-xl border border-border bg-bg-secondary/50 px-3 py-2">
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
