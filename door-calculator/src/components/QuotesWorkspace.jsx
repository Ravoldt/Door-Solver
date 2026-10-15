import React, { useState, useEffect } from "react";
import { dataService } from "../lib/supabase";
import { useAuth } from "../lib/authContext";
import { DEFAULT_PRICE_BOOK, QUOTE_STATUSES } from "../lib/dataModels";
import { calculateQuote, formatCents, parseDollarsToCents } from "../lib/pricingEngine";
import { generateQuotePdf } from "../lib/pdfGenerator";
import { ConfirmModal } from "./ConfirmModal";
import {
  DollarSign,
  Plus,
  Trash2,
  FileText,
  Download,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Percent,
  Receipt,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

export const QuotesWorkspace = ({ preloadedJob = null }) => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [priceBooks, setPriceBooks] = useState([DEFAULT_PRICE_BOOK]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState(null);

  // New Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    customerName: "Valued Customer",
    customerEmail: "",
    customerPhone: "",
    jobName: "Custom Door Project",
    doorType: "2 Panel",
    species: "Poplar",
    profile: "Shaker",
    finish: "Stain",
    doors: [
      { id: "d-1", qty: 2, width: 36, height: 96 },
    ],
    priceBookId: DEFAULT_PRICE_BOOK.id,
    prepOptions: { hingePrep: true, borePrep: false },
    customItems: [],
    discountDollars: 0,
    markupPercent: 25.0,
    taxRatePercent: 6.0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedQuotes, fetchedPBs] = await Promise.all([
        dataService.getQuotes(),
        dataService.getPriceBooks(),
      ]);
      setQuotes(fetchedQuotes || []);
      setPriceBooks(fetchedPBs.length > 0 ? fetchedPBs : [DEFAULT_PRICE_BOOK]);

      if (fetchedQuotes?.length > 0 && !selectedQuote) {
        setSelectedQuote(fetchedQuotes[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load commercial quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // If a job was passed in from the Jobs Workspace, open create quote immediately with pre-filled specs
  useEffect(() => {
    if (preloadedJob) {
      setQuoteForm((prev) => ({
        ...prev,
        jobId: preloadedJob.id,
        jobName: preloadedJob.jobName || preloadedJob.job_name || "Custom Door Project",
        customerName: preloadedJob.customerName || preloadedJob.customer_name || "Valued Customer",
        customerEmail: preloadedJob.customerEmail || preloadedJob.customer_email || "",
        customerPhone: preloadedJob.customerPhone || preloadedJob.customer_phone || "",
        doorType: preloadedJob.doorType || preloadedJob.door_type || "2 Panel",
        species: preloadedJob.species || "Poplar",
        profile: preloadedJob.profile || "Shaker",
        finish: preloadedJob.finish || "Stain",
        doors: preloadedJob.doors || [{ id: "d-1", qty: 1, width: 36, height: 96 }],
      }));
      setShowCreateModal(true);
    }
  }, [preloadedJob]);

  const activePriceBook =
    priceBooks.find((pb) => pb.id === quoteForm.priceBookId) || DEFAULT_PRICE_BOOK;

  // Live calculation of quote totals
  const liveCalculation = calculateQuote({
    doors: quoteForm.doors,
    doorType: quoteForm.doorType,
    species: quoteForm.species,
    profile: quoteForm.profile,
    finish: quoteForm.finish,
    priceBook: activePriceBook,
    prepOptions: quoteForm.prepOptions,
    customItems: quoteForm.customItems,
    discountCents: parseDollarsToCents(quoteForm.discountDollars),
    markupPercentOverride: parseFloat(quoteForm.markupPercent) || 25.0,
    taxRatePercentOverride: parseFloat(quoteForm.taxRatePercent) || 6.0,
  });

  const handleSaveNewQuote = async () => {
    try {
      const created = await dataService.createQuote(
        {
          jobId: quoteForm.jobId || null,
          customerName: quoteForm.customerName,
          customerEmail: quoteForm.customerEmail,
          customerPhone: quoteForm.customerPhone,
          doorType: quoteForm.doorType,
          species: quoteForm.species,
          profile: quoteForm.profile,
          finish: quoteForm.finish,
          doors: quoteForm.doors,
          priceBook: activePriceBook,
          prepOptions: quoteForm.prepOptions,
          customItems: quoteForm.customItems,
          discountCents: parseDollarsToCents(quoteForm.discountDollars),
          markupPercentOverride: parseFloat(quoteForm.markupPercent) || 25.0,
          taxRatePercentOverride: parseFloat(quoteForm.taxRatePercent) || 6.0,
        },
        user?.id
      );

      await dataService.logAuditEvent(
        "QUOTE_CREATED",
        "quotes",
        created.id,
        { quoteNumber: created.quoteNumber, total: formatCents(created.totalCents) },
        user?.id
      );

      toast.success(`Quote ${created.quoteNumber} created!`);
      setShowCreateModal(false);
      await loadData();
      setSelectedQuote(created);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate quote");
    }
  };

  const handleDownloadPdf = (quoteToPrint = selectedQuote) => {
    if (!quoteToPrint) return;
    const calcObj = {
      lineItems: quoteToPrint.lineItems || [],
      subtotalCents: quoteToPrint.subtotalCents ?? quoteToPrint.subtotal_cents ?? 0,
      taxCents: quoteToPrint.taxCents ?? quoteToPrint.tax_cents ?? 0,
      discountCents: quoteToPrint.discountCents ?? quoteToPrint.discount_cents ?? 0,
      totalCents: quoteToPrint.totalCents ?? quoteToPrint.total_cents ?? 0,
      priceBookVersion: quoteToPrint.priceBookVersion || quoteToPrint.price_book_version || "v1.0.0",
      taxRatePercent: quoteToPrint.taxRatePercent || quoteToPrint.tax_rate_percent || 6.0,
    };

    generateQuotePdf({
      quoteNumber: quoteToPrint.quoteNumber || quoteToPrint.quote_number,
      customerName: quoteToPrint.customerName || quoteToPrint.customer_name,
      customerEmail: quoteToPrint.customerEmail || quoteToPrint.customer_email,
      customerPhone: quoteToPrint.customerPhone || quoteToPrint.customer_phone,
      jobName: "Custom Door Quote",
      quoteCalculation: calcObj,
      terms: quoteToPrint.terms,
      validUntil: quoteToPrint.validUntil || quoteToPrint.valid_until,
    });
    toast.success("Quote Proposal PDF generated!");
  };

  // Add/Remove custom line items
  const handleAddCustomItem = () => {
    const customItems = [...quoteForm.customItems];
    customItems.push({ description: "Custom Machining / Delivery", qty: 1, unitPriceCents: 5000 });
    setQuoteForm({ ...quoteForm, customItems });
  };

  const handleRemoveCustomItem = (idx) => {
    const customItems = [...quoteForm.customItems];
    customItems.splice(idx, 1);
    setQuoteForm({ ...quoteForm, customItems });
  };

  const handleConfirmDeleteQuote = async () => {
    if (!quoteToDelete) return;
    const deletedQuote = quoteToDelete;
    try {
      await dataService.deleteQuote(deletedQuote.id);
      await dataService.logAuditEvent(
        "QUOTE_DELETED",
        "quotes",
        deletedQuote.id,
        { quoteNumber: deletedQuote.quoteNumber || deletedQuote.quote_number },
        user?.id
      );
      setQuoteToDelete(null);
      await loadData();
      setSelectedQuote(quotes.find((q) => q.id !== deletedQuote.id) || null);

      toast(
        (t) => (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span>Quote {deletedQuote.quoteNumber || deletedQuote.quote_number} deleted.</span>
            <button
              onClick={async () => {
                await dataService.createQuote(deletedQuote);
                await loadData();
                toast.dismiss(t.id);
                toast.success("Quote restored!");
              }}
              className="text-teal-400 font-bold hover:underline"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete quote");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-[#00A69C]" />
            <span>Commercial Quotes & Estimates</span>
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Generate formal customer quote proposals with frozen price-book versions and integer cent precision.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#00A69C] hover:bg-[#009087] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Quote Proposal</span>
        </button>
      </div>

      {/* Main Layout: Quotes Sidebar + Quote Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Quotes List */}
        <div className="lg:col-span-1 bg-white border border-stone-200 rounded-2xl p-4 space-y-2 h-[750px] overflow-y-auto shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 px-2 mb-2">
            Quote Proposals ({quotes.length})
          </div>

          {quotes.map((q) => {
            const isSelected = selectedQuote?.id === q.id;
            const quoteTotal = q.totalCents ?? q.total_cents ?? 0;

            return (
              <button
                key={q.id}
                onClick={() => setSelectedQuote(q)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-teal-50/70 border-teal-300 shadow-2xs"
                    : "bg-stone-50 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-[#00A69C]">
                    {q.quoteNumber || q.quote_number}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                    {q.status}
                  </span>
                </div>
                <div className="font-bold text-sm text-stone-900 line-clamp-1">
                  {q.customerName || q.customer_name}
                </div>
                <div className="text-xs text-stone-500 mt-1 flex items-center justify-between">
                  <span>PB: {q.priceBookVersion || q.price_book_version}</span>
                  <span className="font-bold text-[#00A69C]">{formatCents(quoteTotal)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Quote Inspector */}
        {selectedQuote ? (
          <div className="lg:col-span-3 space-y-6">
            {/* Top Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold bg-teal-50 text-[#00A69C] border border-teal-200 px-3 py-1.5 rounded-lg">
                    {selectedQuote.quoteNumber || selectedQuote.quote_number}
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    {selectedQuote.customerName || selectedQuote.customer_name}
                  </h3>
                </div>
                <div className="text-xs text-stone-500 mt-1.5 flex items-center gap-3">
                  <span>Price Book: {selectedQuote.priceBookVersion || selectedQuote.price_book_version}</span>
                  <span>•</span>
                  <span>Valid Until: {selectedQuote.validUntil || selectedQuote.valid_until || "30 Days"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadPdf(selectedQuote)}
                  className="bg-[#00A69C] hover:bg-[#009087] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Quote PDF</span>
                </button>

                <button
                  onClick={() => setQuoteToDelete(selectedQuote)}
                  className="bg-white hover:bg-stone-100 text-stone-600 hover:text-rose-600 border border-stone-300 hover:border-rose-300 p-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Delete this quote"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#00A69C]" />
                <span>Itemized Commercial Line Items</span>
              </h4>

              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Unit Price</th>
                      <th className="px-4 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {(selectedQuote.lineItems || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/60">
                        <td className="px-4 py-3 text-stone-400 font-bold">{item.lineNumber || idx + 1}</td>
                        <td className="px-4 py-3 text-stone-900 font-semibold">{item.description}</td>
                        <td className="px-4 py-3 text-[#00A69C] font-bold">{item.qty}</td>
                        <td className="px-4 py-3 font-mono text-stone-700">
                          {formatCents(item.unitPriceCents)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-stone-900">
                          {formatCents(item.totalPriceCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end pt-4">
                <div className="w-80 bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal:</span>
                    <span className="font-mono text-stone-800 font-bold">
                      {formatCents(selectedQuote.subtotalCents ?? selectedQuote.subtotal_cents)}
                    </span>
                  </div>
                  {(selectedQuote.discountCents ?? selectedQuote.discount_cents ?? 0) > 0 && (
                    <div className="flex justify-between text-[#00A69C]">
                      <span>Discount:</span>
                      <span className="font-mono font-bold">
                        -{formatCents(selectedQuote.discountCents ?? selectedQuote.discount_cents)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-500">
                    <span>Estimated Tax ({selectedQuote.taxRatePercent || 6}%):</span>
                    <span className="font-mono text-stone-800 font-bold">
                      {formatCents(selectedQuote.taxCents ?? selectedQuote.tax_cents)}
                    </span>
                  </div>
                  <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold text-[#00A69C]">
                    <span>Total Proposal:</span>
                    <span className="font-mono text-base font-black">
                      {formatCents(selectedQuote.totalCents ?? selectedQuote.total_cents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-500 shadow-sm">
            Select a quote from the left or generate a new quote proposal.
          </div>
        )}
      </div>

      {/* New Quote Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-stone-900 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#00A69C]" />
                  <span>Generate New Commercial Quote</span>
                </h3>
                <p className="text-xs text-stone-500">Calculates itemized pricing locked to chosen Price Book</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Customer Name</label>
                <input
                  type="text"
                  value={quoteForm.customerName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  value={quoteForm.customerEmail}
                  onChange={(e) => setQuoteForm({ ...quoteForm, customerEmail: e.target.value })}
                  placeholder="builder@example.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1 font-semibold">Price Book Version</label>
                <select
                  value={quoteForm.priceBookId}
                  onChange={(e) => setQuoteForm({ ...quoteForm, priceBookId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-[#00A69C] font-bold cursor-pointer"
                >
                  {priceBooks.map((pb) => (
                    <option key={pb.id} value={pb.id}>
                      {pb.name} ({pb.version})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add-ons & Preps */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-stone-800">Machining & Hardware Preps:</div>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={quoteForm.prepOptions.hingePrep}
                    onChange={(e) =>
                      setQuoteForm({
                        ...quoteForm,
                        prepOptions: { ...quoteForm.prepOptions, hingePrep: e.target.checked },
                      })
                    }
                    className="rounded text-[#00A69C] focus:ring-[#00A69C]"
                  />
                  <span>Hinge Prep ($18.00 / door)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={quoteForm.prepOptions.borePrep}
                    onChange={(e) =>
                      setQuoteForm({
                        ...quoteForm,
                        prepOptions: { ...quoteForm.prepOptions, borePrep: e.target.checked },
                      })
                    }
                    className="rounded text-[#00A69C] focus:ring-[#00A69C]"
                  />
                  <span>Bore / Latch Prep ($12.00 / door)</span>
                </label>
              </div>
            </div>

            {/* Live Calculation Preview */}
            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800 border-b border-teal-200/60 pb-2">
                <span>Estimated Proposal Summary</span>
                <span className="text-[#00A69C] font-mono font-bold">
                  {liveCalculation.totalDoors} Doors ({quoteForm.doorType} • {quoteForm.species})
                </span>
              </div>

              <div className="flex justify-between text-xs text-stone-600 pt-1">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-stone-800">
                  {formatCents(liveCalculation.subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-stone-600">
                <span>Estimated Tax ({liveCalculation.taxRatePercent}%):</span>
                <span className="font-mono font-bold text-stone-800">
                  {formatCents(liveCalculation.taxCents)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#00A69C] pt-2 border-t border-teal-200/60">
                <span>Total Quote:</span>
                <span className="font-mono text-base font-black">{formatCents(liveCalculation.totalCents)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveNewQuote}
                className="bg-[#00A69C] hover:bg-[#009087] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Create & Lock Quote</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Quote Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(quoteToDelete)}
        title={`Delete Quote ${quoteToDelete?.quoteNumber || quoteToDelete?.quote_number || ""}?`}
        message="Are you sure you want to delete this commercial quote? You can undo this action immediately."
        confirmLabel="Delete Quote"
        onConfirm={handleConfirmDeleteQuote}
        onCancel={() => setQuoteToDelete(null)}
      />
    </div>
  );
};
