import { useState } from "react";
import { 
  Database, 
  Smartphone, 
  Code2, 
  FileJson, 
  Server, 
  ShieldCheck, 
  Copy, 
  Check, 
  Search 
} from "lucide-react";
import { 
  POSTGRES_SCHEMA, 
  FLUTTER_DART_CODE, 
  API_DOCS, 
  DEPLOYMENT_INSTRUCTIONS, 
  SECURITY_CHECKLIST 
} from "../data/docs";

export default function DeveloperDocs() {
  const [activeTab, setActiveTab] = useState<"schema" | "flutter" | "api" | "deploy" | "security">("schema");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const tabs = [
    { id: "schema", label: "PostgreSQL Schema", icon: Database, content: POSTGRES_SCHEMA, lang: "sql" },
    { id: "flutter", label: "Flutter Mobile Code", icon: Smartphone, content: FLUTTER_DART_CODE, lang: "dart" },
    { id: "api", label: "REST API Specs", icon: FileJson, content: API_DOCS, lang: "markdown" },
    { id: "deploy", label: "Deployment Guide", icon: Server, content: DEPLOYMENT_INSTRUCTIONS, lang: "bash" },
    { id: "security", label: "Security Checklist", icon: ShieldCheck, content: SECURITY_CHECKLIST, lang: "markdown" }
  ] as const;

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Simple filter for content searching
  const highlightSearch = (text: string) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    return text;
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col font-sans" id="dev-docs-container">
      {/* Header bar */}
      <div className="bg-white/10 backdrop-blur-xl px-6 py-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-300" />
            Utility Engineering Reference Center
          </h2>
          <p className="text-xs text-slate-300">Complete enterprise-grade database, code, deployment, and testing files</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search code references..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Tabs list */}
      <div className="bg-white/5 flex overflow-x-auto border-b border-white/10 scrollbar-none px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all duration-150 ${
                isActive 
                  ? "border-cyan-400 text-cyan-300 bg-cyan-400/5 font-bold" 
                  : "border-transparent text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Code viewport */}
      <div className="flex-1 overflow-auto p-4 md:p-6 bg-transparent relative">
        <button
          onClick={() => handleCopy(currentTab.content, currentTab.id)}
          className="absolute right-6 top-6 z-10 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-lg border border-slate-700/50"
          title="Copy to clipboard"
        >
          {copied === currentTab.id ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>

        <div className="font-mono text-[13px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text h-full pr-12">
          {currentTab.lang === "markdown" ? (
            <div className="prose prose-invert max-w-none text-slate-300 select-text">
              {/* Manual markdown parsing since we want simple crisp lines */}
              {currentTab.content.split("\n").map((line, idx) => {
                if (line.startsWith("## ")) {
                  return <h3 key={idx} className="text-lg font-bold text-blue-400 mt-6 mb-2 font-display">{line.replace("## ", "")}</h3>;
                }
                if (line.startsWith("### ")) {
                  return <h4 key={idx} className="text-base font-semibold text-teal-400 mt-4 mb-2 font-display">{line.replace("### ", "")}</h4>;
                }
                if (line.startsWith("#### ")) {
                  return <h5 key={idx} className="text-sm font-semibold text-slate-200 mt-3 mb-1">{line.replace("#### ", "")}</h5>;
                }
                if (line.startsWith("- [ ] ")) {
                  return (
                    <div key={idx} className="flex items-start gap-2 my-1 pl-2">
                      <input type="checkbox" disabled className="mt-1 accent-blue-500" />
                      <span className="text-slate-300">{line.replace("- [ ] ", "")}</span>
                    </div>
                  );
                }
                if (line.startsWith("- ")) {
                  return <li key={idx} className="list-disc list-inside ml-4 my-0.5 text-slate-300">{line.replace("- ", "")}</li>;
                }
                if (line.startsWith("`") || line.startsWith("  `")) {
                  return <code key={idx} className="bg-slate-800/60 px-1.5 py-0.5 rounded text-blue-300 text-xs my-0.5 inline-block">{line.replace(/`/g, "")}</code>;
                }
                return <div key={idx} className="my-1 text-slate-300">{line}</div>;
              })}
            </div>
          ) : (
            <pre className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto min-h-full font-mono text-slate-300">
              <code>{highlightSearch(currentTab.content)}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
