
import { Monitor, User } from "lucide-react"
import { SignInButton, SignOutButton } from "../auth/AuthButton"

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              HTML Viewer Pro
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-slate-400" />
              <div className="flex space-x-2">
                <SignInButton />
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}