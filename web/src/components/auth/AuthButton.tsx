"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import UserDropdown from "./UserDropdown";

export function AuthButton() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return (
      <button 
        disabled
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg opacity-50 cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }
  
  if (!session?.user) {
    const handleSignIn = async () => {
      try {
        await signIn("github", { callbackUrl: "/" });
      } catch (error) {
        console.error("Sign in error:", error);
      }
    };

    return (
      <button 
        onClick={handleSignIn}
        type="button"
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
      >
        Sign in
      </button>
    );
  }

  return <UserDropdown user={session.user} />;
}

export function SignOutButton() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return (
      <button 
        disabled
        className="w-full text-left px-4 py-2 text-slate-300 opacity-50 cursor-not-allowed rounded-lg"
      >
        Loading...
      </button>
    );
  }
  
  if (!session?.user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <button 
      onClick={handleSignOut}
      type="button"
      className="w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
    >
      Sign out
    </button>
  );
}