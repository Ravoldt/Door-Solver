import React, { useState } from "react";
import { X, Copy, Check, Share2, FileText, Building2 } from "lucide-react";
import toast from "react-hot-toast";

export const ShareModal = ({ isOpen, onClose, submissionData, onDownloadPdf }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !submissionData) return null;

  const shareCode = submissionData.shareCode || "TC-XXXX";
  const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCopiedCode(true);
    toast.success(`Share Code ${shareCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-stone-900 animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#00A69C] border border-teal-200 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">Share Your Door Design</h3>
              <p className="text-xs text-stone-500">Saved as an immutable public design snapshot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Share Code Big Card */}
          <div className="bg-stone-50 border border-teal-200 rounded-2xl p-5 text-center shadow-2xs relative overflow-hidden">
            <div className="text-xs uppercase font-bold tracking-widest text-[#00A69C] mb-1">
              Your Custom Share Code
            </div>
            <div className="font-mono text-4xl font-extrabold text-stone-900 tracking-widest my-2 select-all">
              {shareCode}
            </div>
            <p className="text-xs text-stone-500 max-w-xs mx-auto mb-4">
              Give this code to the Trim Choice office in person, by phone, or email to pull up your design.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleCopyCode}
                className="bg-[#00A69C] hover:bg-[#009087] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Code Copied!" : "Copy Share Code"}</span>
              </button>
            </div>
          </div>

          {/* Share Link Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">Direct Share Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00A69C]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Action Guidelines */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs text-stone-700">
            <div className="font-bold text-stone-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#00A69C]" />
              <span>Next Steps with Trim Choice:</span>
            </div>
            <ul className="space-y-1 text-stone-500 list-disc list-inside">
              <li>Call or visit Trim Choice with your code <strong className="text-stone-800">{shareCode}</strong></li>
              <li>Our staff will verify your specs, generate manufacturing cut-lists, and prepare a custom quote.</li>
              <li>Your design is safely stored and can be pulled up at any time.</li>
            </ul>
          </div>

          {/* PDF Download Button */}
          {onDownloadPdf && (
            <button
              onClick={() => {
                onDownloadPdf();
              }}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <FileText className="w-4 h-4 text-[#00A69C]" />
              <span>Download Customer Spec Sheet PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
