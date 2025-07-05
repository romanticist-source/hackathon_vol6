"use client"

import { useState } from "react"
import { User, ChevronDown } from "lucide-react"
import { SignOutButton } from "./AuthButton"

interface UserDropdownProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name || "User"} 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <span className="text-slate-300 text-sm">{user.name || user.email}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="py-2">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  )
}