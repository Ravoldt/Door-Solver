import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/authContext";
import { Navbar } from "./components/Navbar";
import { PublicDesigner } from "./components/PublicDesigner";
import { SharedDesignViewer } from "./components/SharedDesignViewer";
import { StaffInbox } from "./components/StaffInbox";
import { JobsWorkspace } from "./components/JobsWorkspace";
import { QuotesWorkspace } from "./components/QuotesWorkspace";
import { AdminWorkspace } from "./components/AdminWorkspace";
import { ShareModal } from "./components/ShareModal";
import { LoginModal } from "./components/LoginModal";
import { PendingAccountBanner } from "./components/PendingAccountBanner";
import { Toaster } from "react-hot-toast";
import { dataService } from "./lib/supabase";
import { USER_ROLES } from "./lib/dataModels";

const MainAppContent = () => {
  const { role, user, isStaff, isAdmin, isPending } = useAuth();
  const [activeTab, setActiveTab] = useState("designer");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [shareModalData, setShareModalData] = useState(null);
  const [selectedJobForQuote, setSelectedJobForQuote] = useState(null);
  const [designerPreload, setDesignerPreload] = useState(null);
  const [initialLookupCode, setInitialLookupCode] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);

  // Check URL query parameters for ?share=TC-XXXX or ?code=TC-XXXX
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get("share") || urlParams.get("code");
    if (shareParam) {
      setInitialLookupCode(shareParam);
      setActiveTab("lookup");
    }
  }, []);

  // Fetch count of submissions for badge
  useEffect(() => {
    if (isStaff) {
      dataService.getAllSubmissions().then((subs) => {
        setSubmissionCount(subs?.length || 0);
      });
    }
  }, [isStaff, activeTab]);

  // Handle "Import as Job" from Shared viewer or Staff Inbox
  const handleImportToJob = async (submission) => {
    try {
      const spec = submission.designSpec || {};
      const newJobInput = {
        submissionId: submission.id,
        jobName: submission.jobName || "Imported Project",
        customerName: "Customer (Ref: " + submission.shareCode + ")",
        doorType: submission.doorType || "2 Panel",
        species: submission.species || "Poplar",
        profile: submission.profile || "Shaker",
        finish: submission.finish || "Stain",
        doors: spec.doors || [],
        notes: `Imported from customer share code ${submission.shareCode}`,
      };

      const created = await dataService.createJob(newJobInput);
      await dataService.logAuditEvent(
        "JOB_IMPORTED",
        "jobs",
        created.id,
        { shareCode: submission.shareCode },
        user?.id
      );
      setActiveTab("jobs");
    } catch (err) {
      console.error(err);
    }
  };

  // Handle "Modify in Designer"
  const handleEditInDesigner = (submission) => {
    setDesignerPreload(submission);
    setActiveTab("designer");
  };

  // Handle "Create Quote" from Job workspace
  const handleCreateQuoteForJob = (job) => {
    setSelectedJobForQuote(job);
    setActiveTab("quotes");
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-[#00A69C] selection:text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1c1917",
            border: "1px solid #e7e5e4",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            borderRadius: "12px",
            fontSize: "13px",
          },
        }}
      />

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        submissionCount={submissionCount}
      />

      {/* Pending Account Notice Banner */}
      {isPending && <PendingAccountBanner email={user?.email} />}

      {/* Main View Container */}
      <main className="flex-1">
        {activeTab === "designer" && (
          <PublicDesigner
            onOpenShareModal={(sub) => setShareModalData(sub)}
            preloadedSubmission={designerPreload}
          />
        )}

        {activeTab === "lookup" && (
          <SharedDesignViewer
            initialCode={initialLookupCode}
            onEditInDesigner={handleEditInDesigner}
            onImportToJob={handleImportToJob}
          />
        )}

        {activeTab === "inbox" && isStaff && (
          <StaffInbox
            onSelectSubmission={(sub) => {
              setInitialLookupCode(sub.shareCode);
              setActiveTab("lookup");
            }}
            onImportToJob={handleImportToJob}
          />
        )}

        {activeTab === "jobs" && isStaff && (
          <JobsWorkspace onCreateQuoteForJob={handleCreateQuoteForJob} />
        )}

        {activeTab === "quotes" && isStaff && (
          <QuotesWorkspace preloadedJob={selectedJobForQuote} />
        )}

        {activeTab === "admin" && isAdmin && <AdminWorkspace />}
      </main>

      {/* Modals */}
      <ShareModal
        isOpen={Boolean(shareModalData)}
        onClose={() => setShareModalData(null)}
        submissionData={shareModalData}
      />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
