"use client";

// AccountingClient — maneja las tabs de categoría y refresca la lista
// al subir nuevos documentos (sin necesidad de refrescar la página).

import { useState, useTransition } from "react";
import { FileText, ExternalLink, FolderOpen } from "lucide-react";
import { UploadZone } from "./UploadZone";
import { uploadDocument, getDocuments } from "@/actions/documents";
import { type DocCategory } from "@/lib/validations";
import { formatDate } from "@/lib/utils";

interface Doc {
  id: string;
  fileName: string;
  category: string;
  driveFileId: string | null;
  uploadedAt: Date;
}

interface AccountingClientProps {
  initialDocs: Doc[];
  categories: readonly { value: string; label: string }[];
}

const CATEGORY_ICONS: Record<string, string> = {
  INVOICES: "🧾",
  RECEIPTS: "📋",
  PAYROLL: "💼",
  TAX_DOCUMENTS: "🏛️",
  BANK_STATEMENTS: "🏦",
  OTHER: "📁",
};

export function AccountingClient({ initialDocs, categories }: AccountingClientProps) {
  const [activeCategory, setActiveCategory] = useState<DocCategory>(
    categories[0].value as DocCategory
  );
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [, startTransition] = useTransition();

  // Refrescar lista tras un upload exitoso
  function refreshDocs() {
    startTransition(async () => {
      const fresh = await getDocuments();
      setDocs(fresh);
    });
  }

  const categoryDocs = docs.filter((d) => d.category === activeCategory);
  const activeLabel = categories.find((c) => c.value === activeCategory)?.label ?? "";

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-slate-900 rounded-xl p-5 flex items-start gap-4">
        <FolderOpen className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-white text-sm font-medium">Carpeta de Drive compartida con tu contadora</p>
          <p className="text-slate-400 text-xs mt-0.5">
            Cada categoría tiene su propia subcarpeta. La contadora recibe un email cada vez que subes documentos.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => {
          const count = docs.filter((d) => d.category === cat.value).length;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value as DocCategory)}
              className={[
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeCategory === cat.value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              <span>{CATEGORY_ICONS[cat.value] ?? "📄"}</span>
              {cat.label}
              {count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeCategory === cat.value
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload zone */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-1">
            {CATEGORY_ICONS[activeCategory]} Subir a {activeLabel}
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Se subirá a la carpeta <strong>{activeLabel}</strong> en Google Drive
          </p>
          <UploadZone
            category={activeCategory}
            onUpload={uploadDocument}
            onSuccess={refreshDocs}
          />
        </div>

        {/* Document list */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              {activeLabel}
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({categoryDocs.length})
              </span>
            </h2>
          </div>

          {categoryDocs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hay documentos en esta categoría</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categoryDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 font-medium truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  {doc.driveFileId && (
                    <a
                      href={`https://drive.google.com/file/d/${doc.driveFileId}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0"
                    >
                      Drive
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
