// Wrapper para Supabase Storage
// Se usa como backup de los archivos antes de subirlos a Google Drive.
// El cliente de servidor usa la SERVICE_ROLE_KEY para bypass de RLS.

import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

// Sube un archivo al bucket "accounting" y devuelve la URL pública
export async function uploadToStorage(
  shopId: string,
  category: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getClient();

  // Path: accounting/{shopId}/{category}/{timestamp}-{fileName}
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${shopId}/${category}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage
    .from("accounting")
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload error: ${error.message}`);

  const { data } = supabase.storage.from("accounting").getPublicUrl(storagePath);

  return { storagePath, publicUrl: data.publicUrl };
}

/** Sube o reemplaza el logo del taller (path fijo por shop). */
export async function uploadShopLogoToStorage(
  shopId: string,
  buffer: Buffer,
  mimeType: string,
  ext: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getClient();
  const storagePath = `logos/${shopId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from("accounting")
    .upload(storagePath, buffer, { contentType: mimeType, upsert: true });

  if (error) {
    const hint =
      error.message.includes("Bucket not found") || error.message.includes("bucket")
        ? ' Crea el bucket "accounting" en Supabase → Storage (público recomendado).'
        : "";
    throw new Error(`Supabase upload error: ${error.message}${hint}`);
  }

  const { data } = supabase.storage.from("accounting").getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}
