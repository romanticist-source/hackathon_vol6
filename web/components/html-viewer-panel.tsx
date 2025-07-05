"use client"
import { Code } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useState } from "react" // useStateをインポート

interface HtmlViewerPanelProps {
  html: string
  title: string
  icon: LucideIcon
  viewerId: number // To differentiate localhost ports
}

export default function HtmlViewerPanel({ html, title, icon: Icon, viewerId }: HtmlViewerPanelProps) {
  const [mode, setMode] = useState<"code" | "preview">("code") // mode状態を内部で管理
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
      {/* Header Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-b border-slate-600/50">
        <div className="flex items-center space-x-3">
          <Icon className={`w-6 h-6 ${viewerId === 1 ? "text-cyan-400" : "text-purple-400"}`} />
          <span className="font-bold text-white text-lg">{title}</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" aria-hidden="true"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full" aria-hidden="true"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full" aria-hidden="true"></div>
          </div>
        </div>
      </div>
      {/* Content Area */}
      <div className="p-6">
        <div className="flex justify-center items-center">
          <div className="relative w-full">
            <div className="absolute -inset-1 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-slate-800 rounded-2xl p-2">
              <div
                className={`rounded-xl overflow-hidden backdrop-blur-sm border border-slate-700/50 ${mode === "preview" ? "bg-white" : "bg-slate-900/80"}`}
              >
                <div className="from-slate-800 to-slate-700 px-4 py-2 border-b border-slate-600/50 flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full" aria-hidden="true"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" aria-hidden="true"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true"></div>
                  </div>
                  <Code className={`w-4 h-4 ${viewerId === 1 ? "text-cyan-400" : "text-purple-400"}`} />
                  <span className="text-sm text-slate-300 font-mono">
                    {mode === "code" ? `source${viewerId}.html` : `localhost:300${viewerId - 1}`}
                  </span>
                </div>
                <div className="absolute top-1 right-1 z-10">
                  <div className="flex bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg">
                    <button
                      onClick={() => setMode("preview")}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                        mode === "preview"
                          ? "bg-slate-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setMode("code")}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                        mode === "code"
                          ? "bg-slate-600 text-white shadow-sm"
                          : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                      }`}
                    >
                      Code
                    </button>
                  </div>
                </div>
                {mode === "code" ? (
                  <div className="aspect-video p-6 overflow-auto">
                    <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed h-full">
                      <code className="language-html">{html}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="aspect-video">
                    <iframe
                      srcDoc={html}
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                      sandbox="allow-same-origin allow-scripts allow-forms"
                      title={`HTML Preview ${viewerId}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
