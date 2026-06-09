"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, ExternalLink, FolderOpen, AlertCircle } from "lucide-react";
import { UploadZone } from "./UploadZone";
import {
  uploadDocument,
  getAccountingPageData,
  type EnrichedAccountingDocument,
  type SkippedInternalInvoice,
} from "@/actions/documents";
import { type DocCategory } from "@/lib/validations";
import {
  ACCOUNTING_REVENUE_FILTERS,
  type AccountingRevenueFilter,
} from "@/lib/accounting-documents";
import { ADMIN } from "@/lib/routes";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AccountingClientProps {
  initialDocs: EnrichedAccountingDocument[];
  skippedInternalInvoices: SkippedInternalInvoice[];
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

function filterDocsByRevenue(
  docs: EnrichedAccountingDocument[],
  filter: AccountingRevenueFilter
): EnrichedAccountingDocument[] {
  switch (filter) {
    case "OFFICIAL_EXPORTED":
      return docs.filter(
        (d) => d.source === "auto_paid_invoice" && d.revenueType === "OFFICIAL"
      );
    case "MANUAL":
      return docs.filter((d) => d.source === "manual");
    case "INTERNAL_SKIPPED":
      return [];
    default:
      return docs;
  }
}

export function AccountingClient({
  initialDocs,
  skippedInternalInvoices: initialSkipped,
  categories,
}: AccountingClientProps) {
  const [activeCategory, setActiveCategory] = useState<DocCategory>(
    categories[0].value as DocCategory
  );
  const [revenueFilter, setRevenueFilter] = useState<AccountingRevenueFilter>("ALL");
  const [docs, setDocs] = useState(initialDocs);
  const [skippedInvoices, setSkippedInvoices] = useState(initialSkipped);
  const [, startTransition] = useTransition();

  function refreshData() {
    startTransition(async () => {
      const fresh = await getAccountingPageData();
      setDocs(fresh.documents);
      setSkippedInvoices(fresh.skippedInternalInvoices);
    });
  }

  const categoryDocs = docs.filter((d) => d.category === activeCategory);
  const filteredDocs = filterDocsByRevenue(categoryDocs, revenueFilter);
  const activeLabel = categories.find((c) => c.value === activeCategory)?.label ?? "";
  const showRevenueFilters = activeCategory === "INVOICES";
  const activeRevenueFilterMeta = ACCOUNTING_REVENUE_FILTERS.find(
    (f) => f.value === revenueFilter
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-xl p-5 flex items-start gap-4">
        <FolderOpen className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-white text-sm font-medium">
            Carpeta de Drive compartida con tu contadora
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Las facturas de ingreso oficial se exportan al marcar como pagadas. Las marcadas como
            solo interno aparecen en el panel del dueño pero no se envían automáticamente.
          </p>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => {
          const count = docs.filter((d) => d.category === cat.value).length;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setActiveCategory(cat.value as DocCategory);
                setRevenueFilter("ALL");
              }}
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

      {showRevenueFilters && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Filtro por visibilidad contable
          </p>
          <div className="flex gap-1 flex-wrap">
            {ACCOUNTING_REVENUE_FILTERS.map((filter) => {
              const count =
                filter.value === "INTERNAL_SKIPPED"
                  ? skippedInvoices.length
                  : filterDocsByRevenue(categoryDocs, filter.value).length;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setRevenueFilter(filter.value)}
                  className={[
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    revenueFilter === filter.value
                      ? "bg-violet-600 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {filter.label}
                  {count > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        revenueFilter === filter.value
                          ? "bg-violet-500 text-white"
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
          {activeRevenueFilterMeta && (
            <p className="text-xs text-slate-500">{activeRevenueFilterMeta.description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            onSuccess={refreshData}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">
              {revenueFilter === "INTERNAL_SKIPPED"
                ? "Facturas solo interno (no exportadas)"
                : activeLabel}
              <span className="ml-2 text-sm font-normal text-slate-400">
                (
                {revenueFilter === "INTERNAL_SKIPPED"
                  ? skippedInvoices.length
                  : filteredDocs.length}
                )
              </span>
            </h2>
          </div>

          {revenueFilter === "INTERNAL_SKIPPED" ? (
            skippedInvoices.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  No hay facturas pagadas marcadas como solo interno
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {skippedInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`${ADMIN.invoices}/${inv.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {inv.paidAt ? formatDate(inv.paidAt) : "—"} · Solo interno
                      </p>
                      <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        No exportada automáticamente a contabilidad
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 flex-shrink-0">
                      {formatCurrency(inv.recordedRevenue ?? inv.total)}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : filteredDocs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hay documentos con este filtro</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
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
                        {doc.linkedInvoiceNumber && (
                          <>
                            {" "}
                            ·{" "}
                            <Link
                              href={`${ADMIN.invoices}/${doc.linkedInvoiceId}`}
                              className="text-blue-600 hover:underline"
                            >
                              {doc.linkedInvoiceNumber}
                            </Link>
                          </>
                        )}
                      </p>
                      {doc.source === "auto_paid_invoice" && (
                        <p className="text-xs text-emerald-700 mt-0.5">Ingreso oficial exportado</p>
                      )}
                      {doc.source === "manual" && (
                        <p className="text-xs text-slate-500 mt-0.5">Subida manual</p>
                      )}
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
