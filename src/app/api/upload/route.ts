import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdminRequest, AdminAccessError } from '@/lib/supabase/admin-auth';
import { deleteUploadedImageByUrl, uploadImage } from '@/lib/supabase/storage';

export async function POST(request: NextRequest) {
  try {
    await authorizeAdminRequest();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'no file' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'not image' }, { status: 400 });
    }

    const url = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AdminAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error('upload error:', err);
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await authorizeAdminRequest();

    const payload = (await request.json().catch(() => null)) as
      | { url?: string }
      | null;

    if (!payload?.url) {
      return NextResponse.json({ error: 'no url' }, { status: 400 });
    }

    await deleteUploadedImageByUrl(payload.url);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminAccessError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error('upload delete error:', err);
    return NextResponse.json({ error: 'delete failed' }, { status: 500 });
  }
}
