import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, getRequestUser, isRateLimited } from '@/lib/server-auth';
import { safeUrl } from '@/lib/safe-url';

const BUCKET_MARKER = '/storage/v1/object/public/resources/';
const SIGNED_URL_TTL_SECONDS = 60;

// Members get a short-lived signed link to files in the private `resources` bucket.
// External links (format "link") are passed through after URL sanitizing.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (await isRateLimited(`resource-download:${user.id}`, 60, 60)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const supabase = createServiceClient();
  const { data: member } = await supabase.from('users').select('status').eq('id', user.id).maybeSingle();
  if (member?.status !== 'active' && member?.status !== 'admin') {
    return NextResponse.json({ error: 'Membership not active' }, { status: 403 });
  }

  const { id } = await params;
  const { data: resource } = await supabase.from('resources').select('file_url').eq('id', id).maybeSingle();
  if (!resource?.file_url) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const markerAt = resource.file_url.indexOf(BUCKET_MARKER);
  if (markerAt === -1) {
    const url = safeUrl(resource.file_url);
    return url ? NextResponse.json({ url }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const path = decodeURIComponent(resource.file_url.slice(markerAt + BUCKET_MARKER.length).split('?')[0]);
  const { data: signed, error } = await supabase.storage
    .from('resources')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !signed?.signedUrl) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ url: signed.signedUrl });
}
