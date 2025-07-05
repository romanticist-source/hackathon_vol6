"use client"

import { useState } from "react"
import { Sparkles, Zap, Monitor } from "lucide-react"
import HtmlViewerPanel from "../components/htmlViewer/HtmlViewerPanel"
import { htmlSnippets } from "../../src/lib/html-Sample"

export default function ModernHTMLViewer() {
  const [html, setHtml] = useState("<h1>Hello World!</h1>")
  {/* ランダムなHTMLを取得　ここでバックエンドからHTMLデータを取得する予定 */}
  const handleClick = () => {
    setHtml(htmlSnippets[Math.floor(Math.random() * htmlSnippets.length)])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-full mx-auto space-y-6 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            HTML Viewer Pro
          </h1>
          <p className="text-slate-400">Experience the future of HTML visualization</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleClick}
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:scale-105 hover:rotate-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center space-x-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>ランダムHTMLを生成</span>
              <Zap className="w-5 h-5 animate-bounce" />
            </div>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側のビューア */}
          <HtmlViewerPanel html={html} title="HTMLビューア 1" icon={Monitor} viewerId={1} />
          {/* 右側のビューア */}
          <HtmlViewerPanel html={html} title="HTMLビューア 2" icon={Monitor} viewerId={2} />
        </div>
      </div>
    </div>
  )
}
