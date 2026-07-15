import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKETS = {
  properties: 'property-images',
  blogs: 'blog-images',
  communities: 'community-images',
} as const;

type BucketType = keyof typeof BUCKETS;

/**
 * Upload a file to Supabase Storage and return the public URL
 */
export async function uploadImage(
  file: File,
  type: BucketType,
  folder?: string
): Promise<{ url: string; path: string; error: string | null }> {
  const bucket = BUCKETS[type];

  if (!supabaseUrl || !supabaseKey) {
    return { url: '', path: '', error: 'Supabase not configured' };
  }

  try {
    // Ensure bucket exists (creates if not)
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === bucket);
    if (!exists) {
      await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
      });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const fileName = `${folder ? folder + '/' : ''}${timestamp}-${random}.${ext}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Upload] Error:', error);
      return { url: '', path: '', error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path, error: null };
  } catch (err: any) {
    console.error('[Upload] Exception:', err);
    return { url: '', path: '', error: err.message || 'Upload failed' };
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(path: string, type: BucketType): Promise<boolean> {
  const bucket = BUCKETS[type];
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Extract storage path from a public URL (for deletion)
 */
export function extractPathFromUrl(url: string, type: BucketType): string | null {
  const bucket = BUCKETS[type];
  const prefix = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;
  if (url.startsWith(prefix)) {
    return url.replace(prefix, '');
  }
  return null;
}
