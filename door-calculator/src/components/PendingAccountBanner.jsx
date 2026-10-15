import React from "react";
import { Clock } from "lucide-react";

export const PendingAccountBanner = ({ email = "" }) => {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          <span>
            <strong>Account Awaiting Approval:</strong> Signed in as <strong className="text-stone-900">{email}</strong>. An administrator must approve your account before you can access internal staff jobs and quoting tools.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PendingAccountBanner;
