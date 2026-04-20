import 'server-only';

import { randomUUID } from 'node:crypto';
import { getSupabaseAdminClient } from './admin';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const UPLOADS_BUCKET = 'uploads';

function getExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase();
  if (fromName) {
    return fromName;
  }

  const fromType = file.type.split('/').pop()?.trim().toLowerCase();
  return fromType || 'jpg';
}

export async function uploadImage(file: File): Promise<string> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin is not configured.');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('not image');
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error('too large');
  }

  const ext = getExtension(file);
  const now = new Date();
  const path = `admin/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(UPLOADS_BUCKET).upload(path, bytes, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error('Failed to resolve uploaded image URL.');
  }

  return data.publicUrl;
}

function getUploadsObjectPath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${UPLOADS_BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) {
      return null;
    }

    const path = url.pathname.slice(index + marker.length);
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

export async function deleteUploadedImageByUrl(
  publicUrl: string | null | undefined,
): Promise<void> {
  if (!publicUrl) {
    return;
  }

  const objectPath = getUploadsObjectPath(publicUrl);
  if (!objectPath) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin is not configured.');
  }

  const { error } = await supabase.storage.from(UPLOADS_BUCKET).remove([objectPath]);
  if (error) {
    throw new Error(error.message);
  }
}
