import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isRealSupabaseConfigured, dataService } from "./supabase";
import { USER_ROLES } from "./dataModels";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

const MOCK_AUTH_STORAGE_KEY = "doorsolver_mock_auth_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (isRealSupabaseConfigured) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            setUser(session.user);
            // Fetch profile
            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            if (isMounted) setProfile(profileData || null);
          }
        } else {
          // Check local mock auth
          const savedMockUser = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
          if (savedMockUser) {
            const parsed = JSON.parse(savedMockUser);
            setUser(parsed);
            setProfile(parsed.profile);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    if (isRealSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setProfile(profileData || null);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // --- ACTIONS ---

  const signInWithGoogle = async () => {
    if (isRealSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
        throw error;
      }
      return;
    }

    // Mock Google sign-in
    const mockGoogleProfile = {
      id: "usr-google-" + Date.now(),
      email: "google.employee@trimchoice.com",
      fullName: "Trim Choice Google User",
      role: USER_ROLES.STAFF,
      isActive: true,
    };
    const mockUser = {
      id: mockGoogleProfile.id,
      email: mockGoogleProfile.email,
      user_metadata: { full_name: mockGoogleProfile.fullName },
      profile: mockGoogleProfile,
    };

    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    setProfile(mockGoogleProfile);
    toast.success("Signed in with Google (Demo)");
  };

  const signInWithEmail = async (email, password) => {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        throw error;
      }
      return data;
    }

    // Mock Email login: check profiles in mock store
    const profiles = await dataService.getProfiles();
    const existing = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

    const activeProfile = existing || {
      id: "usr-mock-" + Date.now(),
      email,
      fullName: email.split("@")[0],
      role: email.includes("admin")
        ? USER_ROLES.ADMIN
        : email.includes("staff")
        ? USER_ROLES.STAFF
        : USER_ROLES.PENDING,
      isActive: true,
    };

    const mockUser = {
      id: activeProfile.id,
      email: activeProfile.email,
      profile: activeProfile,
    };

    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    setProfile(activeProfile);
    toast.success(`Signed in as ${activeProfile.fullName} (${activeProfile.role})`);
    return mockUser;
  };

  const signUpWithEmail = async (email, password, fullName) => {
    if (isRealSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) {
        toast.error(error.message);
        throw error;
      }
      toast.success("Account created! Awaiting admin approval.");
      return data;
    }

    // Mock signup defaults to PENDING
    const newProfile = {
      id: "usr-mock-" + Date.now(),
      email,
      fullName: fullName || email.split("@")[0],
      role: USER_ROLES.PENDING,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const profiles = await dataService.getProfiles();
    profiles.push(newProfile);
    localStorage.setItem("doorsolver_profiles", JSON.stringify(profiles));

    const mockUser = {
      id: newProfile.id,
      email: newProfile.email,
      profile: newProfile,
    };

    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    setProfile(newProfile);
    toast.success("Account registered! Status: Pending Approval.");
    return mockUser;
  };

  const signOut = async () => {
    if (isRealSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    setUser(null);
    setProfile(null);
    toast.success("Signed out");
  };

  // Demo one-click role switcher for fast evaluation
  const setDemoRole = async (targetRole) => {
    const roleProfiles = {
      [USER_ROLES.ADMIN]: {
        id: "usr-admin-1",
        email: "admin@trimchoice.com",
        fullName: "Alex Admin (Administrator)",
        role: USER_ROLES.ADMIN,
        isActive: true,
      },
      [USER_ROLES.STAFF]: {
        id: "usr-staff-1",
        email: "estimator@trimchoice.com",
        fullName: "Sam Staff (Estimator)",
        role: USER_ROLES.STAFF,
        isActive: true,
      },
      [USER_ROLES.PENDING]: {
        id: "usr-pending-1",
        email: "newhire@trimchoice.com",
        fullName: "Jordan Pending (Awaiting Approval)",
        role: USER_ROLES.PENDING,
        isActive: true,
      },
      [USER_ROLES.PUBLIC]: null,
    };

    const selected = roleProfiles[targetRole];
    if (!selected) {
      await signOut();
      return;
    }

    const mockUser = {
      id: selected.id,
      email: selected.email,
      profile: selected,
    };
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    setProfile(selected);
    toast.success(`Switched role to: ${targetRole.toUpperCase()}`);
  };

  const currentRole = profile?.role || USER_ROLES.PUBLIC;
  const isStaff = currentRole === USER_ROLES.STAFF || currentRole === USER_ROLES.ADMIN;
  const isAdmin = currentRole === USER_ROLES.ADMIN;
  const isPending = currentRole === USER_ROLES.PENDING;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: currentRole,
        isStaff,
        isAdmin,
        isPending,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        setDemoRole,
        isRealSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
