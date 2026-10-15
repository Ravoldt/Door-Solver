/**
 * Supabase Client & Local Mock Storage Fallback
 * 
 * Automatically uses real Supabase client when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are present, or falls back to an interactive localStorage mock store for offline/demo development.
 */

import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_PUBLIC_SPEC,
  DEFAULT_PRODUCTION_PRESETS,
  DEFAULT_PRICE_BOOK,
  USER_ROLES,
  generateShareCode,
  generateShareToken,
  sanitizePublicDesignSpec,
} from "./dataModels";
import { calculateShopParts } from "./calculationEngine";
import { calculateQuote } from "./pricingEngine";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isRealSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project-id.supabase.co" &&
    supabaseAnonKey !== "your-supabase-anon-key-here"
);

export const supabase = isRealSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// LOCAL STORAGE MOCK REPOSITORY
// ============================================================================
const MOCK_STORAGE_KEYS = {
  PROFILES: "doorsolver_profiles",
  SUBMISSIONS: "doorsolver_submissions",
  JOBS: "doorsolver_jobs",
  PRICE_BOOKS: "doorsolver_price_books",
  QUOTES: "doorsolver_quotes",
  AUDIT_EVENTS: "doorsolver_audit_events",
};

const getStored = (key, fallback = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
};

// Seed initial mock data if empty
const initializeMockData = () => {
  // Profiles
  if (!localStorage.getItem(MOCK_STORAGE_KEYS.PROFILES)) {
    const defaultProfiles = [
      {
        id: "usr-admin-1",
        email: "admin@trimchoice.com",
        fullName: "Alex Admin",
        role: USER_ROLES.ADMIN,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr-staff-1",
        email: "estimator@trimchoice.com",
        fullName: "Sam Staff (Estimator)",
        role: USER_ROLES.STAFF,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "usr-pending-1",
        email: "newhire@trimchoice.com",
        fullName: "Jordan Pending",
        role: USER_ROLES.PENDING,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
    setStored(MOCK_STORAGE_KEYS.PROFILES, defaultProfiles);
  }

  // Price Books
  if (!localStorage.getItem(MOCK_STORAGE_KEYS.PRICE_BOOKS)) {
    setStored(MOCK_STORAGE_KEYS.PRICE_BOOKS, [DEFAULT_PRICE_BOOK]);
  }

  // Submissions
  if (!localStorage.getItem(MOCK_STORAGE_KEYS.SUBMISSIONS)) {
    const sampleSubmissions = [
      {
        id: "sub-101",
        shareCode: "TC-8492",
        shareToken: "tok_sample_101_abc",
        jobName: "Highland Residence Master Bedroom",
        doorType: "2 Panel",
        species: "White Oak",
        profile: "Shaker",
        finish: "Stain",
        designSpec: {
          doors: [
            { id: "d-1", qty: 2, width: 36, height: 96, visualProportions: { stileWidth: 5, topRailWidth: 5, lockRailWidth: 6.25, bottomRailWidth: 9, heightToLockRail: 36 } },
            { id: "d-2", qty: 4, width: 32, height: 84, visualProportions: { stileWidth: 4.5, topRailWidth: 4.5, lockRailWidth: 5.5, bottomRailWidth: 8, heightToLockRail: 34 } },
          ],
        },
        schemaVersion: "1.0.0",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "sub-102",
        shareCode: "TC-4921",
        shareToken: "tok_sample_102_def",
        jobName: "Lakeside Cottage Pantry",
        doorType: "1 Panel",
        species: "Poplar",
        profile: "Ovolo",
        finish: "Paint",
        designSpec: {
          doors: [
            { id: "d-1", qty: 3, width: 30, height: 80, visualProportions: { stileWidth: 4.5, topRailWidth: 4.5, bottomRailWidth: 8 } },
          ],
        },
        schemaVersion: "1.0.0",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ];
    setStored(MOCK_STORAGE_KEYS.SUBMISSIONS, sampleSubmissions);
  }

  // Jobs
  if (!localStorage.getItem(MOCK_STORAGE_KEYS.JOBS)) {
    const sampleJobs = [
      {
        id: "job-101",
        jobCode: "JOB-2026-001",
        submissionId: "sub-101",
        jobName: "Highland Residence Master Bedroom",
        customerName: "Robert Miller",
        customerEmail: "robert@millerbuilders.com",
        customerPhone: "(555) 392-1084",
        doorType: "2 Panel",
        species: "White Oak",
        profile: "Shaker",
        finish: "Stain",
        status: "in_production",
        staffOwnerId: "usr-staff-1",
        productionPresets: DEFAULT_PRODUCTION_PRESETS,
        doors: [
          { id: "d-1", qty: 2, width: 36, height: 96, visualProportions: { stileWidth: 5, topRailWidth: 5, lockRailWidth: 6.25, bottomRailWidth: 9, heightToLockRail: 36 } },
          { id: "d-2", qty: 4, width: 32, height: 84, visualProportions: { stileWidth: 4.5, topRailWidth: 4.5, lockRailWidth: 5.5, bottomRailWidth: 8, heightToLockRail: 34 } },
        ],
        partsCache: calculateShopParts(
          [
            { id: "d-1", qty: 2, width: 36, height: 96, visualProportions: { stileWidth: 5, topRailWidth: 5, lockRailWidth: 6.25, bottomRailWidth: 9, heightToLockRail: 36 } },
            { id: "d-2", qty: 4, width: 32, height: 84, visualProportions: { stileWidth: 4.5, topRailWidth: 4.5, lockRailWidth: 5.5, bottomRailWidth: 8, heightToLockRail: 34 } },
          ],
          DEFAULT_PRODUCTION_PRESETS,
          "2 Panel",
          "Shaker"
        ),
        notes: "Customer requested heavy chamfer on lock rail.",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
    ];
    setStored(MOCK_STORAGE_KEYS.JOBS, sampleJobs);
  }

  // Audit Events
  if (!localStorage.getItem(MOCK_STORAGE_KEYS.AUDIT_EVENTS)) {
    const initialEvents = [
      {
        id: "aud-1",
        actorId: "usr-admin-1",
        action: "PRICE_BOOK_PUBLISHED",
        entityType: "price_books",
        entityId: "pb-v1.0.0",
        details: { version: "v1.0.0", name: "Standard 2026 Price Book (Trim Choice)" },
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      },
    ];
    setStored(MOCK_STORAGE_KEYS.AUDIT_EVENTS, initialEvents);
  }
};

initializeMockData();

// ============================================================================
// UNIFIED DATA SERVICE API (Supabase / Local Mock)
// ============================================================================

export const dataService = {
  // --- SUBMISSIONS ---
  async saveDesignSubmission(publicSpec) {
    const sanitized = sanitizePublicDesignSpec(publicSpec);
    const shareCode = generateShareCode();
    const shareToken = generateShareToken();

    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("design_submissions")
        .insert({
          share_code: shareCode,
          share_token: shareToken,
          job_name: sanitized.jobName,
          door_type: sanitized.doorType,
          species: sanitized.species,
          profile: sanitized.profile,
          finish: sanitized.finish,
          design_spec: sanitized,
          schema_version: sanitized.schemaVersion,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        shareCode: data.share_code,
        shareToken: data.share_token,
        ...sanitized,
      };
    }

    // Mock
    const submissions = getStored(MOCK_STORAGE_KEYS.SUBMISSIONS);
    const newSubmission = {
      id: "sub-" + Date.now(),
      shareCode,
      shareToken,
      ...sanitized,
      createdAt: new Date().toISOString(),
    };
    submissions.unshift(newSubmission);
    setStored(MOCK_STORAGE_KEYS.SUBMISSIONS, submissions);
    return newSubmission;
  },

  async getDesignSubmissionByCode(code) {
    const searchCode = String(code || "").trim().toUpperCase();
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("design_submissions")
        .select("*")
        .eq("share_code", searchCode)
        .single();
      if (error) return null;
      return {
        id: data.id,
        shareCode: data.share_code,
        shareToken: data.share_token,
        jobName: data.job_name,
        doorType: data.door_type,
        species: data.species,
        profile: data.profile,
        finish: data.finish,
        designSpec: data.design_spec,
        createdAt: data.created_at,
      };
    }

    const submissions = getStored(MOCK_STORAGE_KEYS.SUBMISSIONS);
    return submissions.find((s) => s.shareCode.toUpperCase() === searchCode) || null;
  },

  async getAllSubmissions() {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("design_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((d) => ({
        id: d.id,
        shareCode: d.share_code,
        shareToken: d.share_token,
        jobName: d.job_name,
        doorType: d.door_type,
        species: d.species,
        profile: d.profile,
        finish: d.finish,
        designSpec: d.design_spec,
        createdAt: d.created_at,
      }));
    }

    return getStored(MOCK_STORAGE_KEYS.SUBMISSIONS);
  },

  // --- JOBS ---
  async createJob(jobInput) {
    const jobCode = "JOB-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 9000));
    const partsCache = calculateShopParts(
      jobInput.doors,
      jobInput.productionPresets || DEFAULT_PRODUCTION_PRESETS,
      jobInput.doorType,
      jobInput.profile
    );

    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          job_code: jobCode,
          submission_id: jobInput.submissionId || null,
          job_name: jobInput.jobName || "New Shop Job",
          customer_name: jobInput.customerName || "",
          customer_email: jobInput.customerEmail || "",
          customer_phone: jobInput.customerPhone || "",
          door_type: jobInput.doorType || "2 Panel",
          species: jobInput.species || "Poplar",
          profile: jobInput.profile || "Shaker",
          finish: jobInput.finish || "Stain",
          status: jobInput.status || "draft",
          staff_owner_id: jobInput.staffOwnerId || null,
          production_presets: jobInput.productionPresets || DEFAULT_PRODUCTION_PRESETS,
          doors: jobInput.doors || [],
          parts_cache: partsCache,
          notes: jobInput.notes || "",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const jobs = getStored(MOCK_STORAGE_KEYS.JOBS);
    const newJob = {
      id: "job-" + Date.now(),
      jobCode,
      submissionId: jobInput.submissionId || null,
      jobName: jobInput.jobName || "New Shop Job",
      customerName: jobInput.customerName || "",
      customerEmail: jobInput.customerEmail || "",
      customerPhone: jobInput.customerPhone || "",
      doorType: jobInput.doorType || "2 Panel",
      species: jobInput.species || "Poplar",
      profile: jobInput.profile || "Shaker",
      finish: jobInput.finish || "Stain",
      status: jobInput.status || "draft",
      staffOwnerId: jobInput.staffOwnerId || null,
      productionPresets: jobInput.productionPresets || DEFAULT_PRODUCTION_PRESETS,
      doors: jobInput.doors || [],
      partsCache,
      notes: jobInput.notes || "",
      createdAt: new Date().toISOString(),
    };
    jobs.unshift(newJob);
    setStored(MOCK_STORAGE_KEYS.JOBS, jobs);
    return newJob;
  },

  async getJobs() {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    return getStored(MOCK_STORAGE_KEYS.JOBS);
  },

  async updateJob(jobId, updates) {
    if (updates.doors || updates.productionPresets || updates.doorType || updates.profile) {
      // Recalculate parts cache
      const existing = await this.getJobById(jobId);
      const doors = updates.doors || existing?.doors || [];
      const presets = updates.productionPresets || existing?.productionPresets || DEFAULT_PRODUCTION_PRESETS;
      const doorType = updates.doorType || existing?.doorType || "2 Panel";
      const profile = updates.profile || existing?.profile || "Shaker";
      updates.partsCache = calculateShopParts(doors, presets, doorType, profile);
    }

    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", jobId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const jobs = getStored(MOCK_STORAGE_KEYS.JOBS);
    const index = jobs.findIndex((j) => j.id === jobId);
    if (index !== -1) {
      jobs[index] = { ...jobs[index], ...updates, updatedAt: new Date().toISOString() };
      setStored(MOCK_STORAGE_KEYS.JOBS, jobs);
      return jobs[index];
    }
    return null;
  },

  async getJobById(jobId) {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      if (error) return null;
      return data;
    }
    const jobs = getStored(MOCK_STORAGE_KEYS.JOBS);
    return jobs.find((j) => j.id === jobId) || null;
  },

  async deleteJob(jobId) {
    if (isRealSupabaseConfigured) {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
      return true;
    }
    const jobs = getStored(MOCK_STORAGE_KEYS.JOBS);
    const updated = jobs.filter((j) => j.id !== jobId);
    setStored(MOCK_STORAGE_KEYS.JOBS, updated);
    return true;
  },

  // --- PRICE BOOKS ---
  async getPriceBooks() {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("price_books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    return getStored(MOCK_STORAGE_KEYS.PRICE_BOOKS, [DEFAULT_PRICE_BOOK]);
  },

  async createPriceBook(pbData, actorId = null) {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("price_books")
        .insert({
          version: pbData.version,
          name: pbData.name,
          status: pbData.status || "published",
          rules: pbData.rules,
          created_by: actorId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const books = getStored(MOCK_STORAGE_KEYS.PRICE_BOOKS);
    const newBook = {
      id: "pb-" + Date.now(),
      version: pbData.version,
      name: pbData.name,
      status: pbData.status || "published",
      effectiveDate: new Date().toISOString(),
      rules: pbData.rules,
      createdAt: new Date().toISOString(),
    };
    books.unshift(newBook);
    setStored(MOCK_STORAGE_KEYS.PRICE_BOOKS, books);
    return newBook;
  },

  // --- QUOTES ---
  async createQuote(quoteInput, actorId = null) {
    const quoteNumber = "QTE-" + new Date().getFullYear() + "-" + String(Math.floor(100 + Math.random() * 900));

    const calculated = calculateQuote({
      doors: quoteInput.doors,
      doorType: quoteInput.doorType,
      species: quoteInput.species,
      profile: quoteInput.profile,
      finish: quoteInput.finish,
      priceBook: quoteInput.priceBook || DEFAULT_PRICE_BOOK,
      prepOptions: quoteInput.prepOptions,
      customItems: quoteInput.customItems,
      discountCents: quoteInput.discountCents,
      markupPercentOverride: quoteInput.markupPercentOverride,
      taxRatePercentOverride: quoteInput.taxRatePercentOverride,
    });

    const quoteRecord = {
      id: "qte-" + Date.now(),
      quoteNumber,
      jobId: quoteInput.jobId || null,
      priceBookId: calculated.priceBookId,
      priceBookVersion: calculated.priceBookVersion,
      customerName: quoteInput.customerName || "Valued Customer",
      customerEmail: quoteInput.customerEmail || "",
      customerPhone: quoteInput.customerPhone || "",
      status: "draft",
      subtotalCents: calculated.subtotalCents,
      taxCents: calculated.taxCents,
      discountCents: calculated.discountCents,
      totalCents: calculated.totalCents,
      markupPercent: calculated.markupPercent,
      taxRatePercent: calculated.taxRatePercent,
      terms: "Quote valid for 30 days. 50% deposit required upon order confirmation.",
      validUntil: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
      lineItems: calculated.lineItems,
      createdBy: actorId,
      createdAt: new Date().toISOString(),
    };

    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("quotes")
        .insert({
          quote_number: quoteNumber,
          job_id: quoteInput.jobId || null,
          price_book_id: calculated.priceBookId,
          price_book_version: calculated.priceBookVersion,
          customer_name: quoteRecord.customerName,
          customer_email: quoteRecord.customerEmail,
          customer_phone: quoteRecord.customerPhone,
          status: "draft",
          subtotal_cents: calculated.subtotalCents,
          tax_cents: calculated.taxCents,
          discount_cents: calculated.discountCents,
          total_cents: calculated.totalCents,
          markup_percent: calculated.markupPercent,
          tax_rate_percent: calculated.taxRatePercent,
          terms: quoteRecord.terms,
          valid_until: quoteRecord.validUntil,
          created_by: actorId,
        })
        .select()
        .single();
      if (error) throw error;
      return { ...data, lineItems: calculated.lineItems };
    }

    const quotes = getStored(MOCK_STORAGE_KEYS.QUOTES);
    quotes.unshift(quoteRecord);
    setStored(MOCK_STORAGE_KEYS.QUOTES, quotes);
    return quoteRecord;
  },

  async getQuotes() {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    return getStored(MOCK_STORAGE_KEYS.QUOTES);
  },

  async deleteQuote(quoteId) {
    if (isRealSupabaseConfigured) {
      const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
      if (error) throw error;
      return true;
    }
    const quotes = getStored(MOCK_STORAGE_KEYS.QUOTES);
    const updated = quotes.filter((q) => q.id !== quoteId);
    setStored(MOCK_STORAGE_KEYS.QUOTES, updated);
    return true;
  },

  // --- PROFILES & USER ROLES ---
  async getProfiles() {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    return getStored(MOCK_STORAGE_KEYS.PROFILES);
  },

  async updateProfileRole(profileId, newRole) {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", profileId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const profiles = getStored(MOCK_STORAGE_KEYS.PROFILES);
    const index = profiles.findIndex((p) => p.id === profileId);
    if (index !== -1) {
      profiles[index].role = newRole;
      setStored(MOCK_STORAGE_KEYS.PROFILES, profiles);
      return profiles[index];
    }
    return null;
  },

  // --- AUDIT EVENTS ---
  async logAuditEvent(action, entityType, entityId, details = {}, actorId = null) {
    const event = {
      id: "aud-" + Date.now(),
      actorId,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };

    if (isRealSupabaseConfigured) {
      await supabase.from("audit_events").insert({
        actor_id: actorId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      });
      return;
    }

    const events = getStored(MOCK_STORAGE_KEYS.AUDIT_EVENTS);
    events.unshift(event);
    setStored(MOCK_STORAGE_KEYS.AUDIT_EVENTS, events);
  },

  async getAuditEvents() {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    }
    return getStored(MOCK_STORAGE_KEYS.AUDIT_EVENTS);
  },
};
