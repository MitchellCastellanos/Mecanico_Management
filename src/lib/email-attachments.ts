const MAX_EMAIL_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function parseEmailAttachments(formData?: FormData) {
  if (!formData) return { attachments: [] as { filename: string; content: Buffer }[] };

  const files = formData
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > MAX_EMAIL_ATTACHMENTS) {
    return { error: `Máximo ${MAX_EMAIL_ATTACHMENTS} archivos adjuntos` };
  }

  const attachments: { filename: string; content: Buffer }[] = [];

  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { error: `${file.name} supera el límite de 5 MB` };
    }
    const type = file.type || "application/octet-stream";
    if (!ALLOWED_ATTACHMENT_TYPES.has(type)) {
      return { error: `${file.name}: solo PDF o imágenes (JPG, PNG, WebP)` };
    }
    attachments.push({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
    });
  }

  return { attachments };
}
