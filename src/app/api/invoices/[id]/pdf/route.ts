// Route Handler — GET /api/invoices/[id]/pdf
//
// ¿Por qué un Route Handler y no una Server Action?
// Porque el navegador necesita una URL para descargar un archivo.
// Un <a href="/api/invoices/INV001/pdf" download> funciona nativamente.
// Las Server Actions son llamadas de función — no generan URLs descargables.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePdf } from "@/lib/pdf";
import { serializeInvoiceForPdf } from "@/lib/invoice-serialize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.shopId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const shopId = session.user.shopId;

  // Obtener factura (scoped al shop — seguridad)
  const invoice = await db.invoice.findFirst({
    where: { id, shopId },
    include: {
      client: true,
      vehicle: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      shop: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  // Serializar campos Decimal de Prisma a string antes de pasarlos al PDF
  const invoiceData = serializeInvoiceForPdf(invoice);

  // Generar PDF como Buffer
  const pdfBuffer = await generateInvoicePdf(invoiceData);

  // Devolver como stream con headers correctos para descarga
  // NextResponse en Next.js 16 no acepta Buffer directamente — usar Uint8Array
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
