import { useEffect, useState, useRef } from "react";
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useAdvancedMarkerRef 
} from "@vis.gl/react-google-maps";
import { 
  AlertTriangle, 
  Wrench, 
  Droplets, 
  Info, 
  Layers, 
  MapPin, 
  RefreshCw, 
  Sparkles, 
  Compass, 
  PlusCircle, 
  X, 
  CheckCircle2, 
  ChevronRight 
} from "lucide-react";

// API Key retrieval
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.trim() !== "";

export interface MapIncident {
  id: string;
  type: "leak" | "maintenance" | "outage";
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  status: "active" | "planned" | "in-progress" | "resolved";
  reportedAt: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface ServiceStatusMapProps {
  isHighContrast: boolean;
  activeAccountNo: string;
  triggerRefreshSignal: number;
  onReportAtLocation?: (lat: number, lng: number, address: string) => void;
}

const DEFAULT_MAP_INCIDENTS: MapIncident[] = [
  {
    id: "cmp-001",
    type: "leak",
    title: "Water Leak / Pipe Burst",
    description: "Water leaking heavily from the main meter pipe connection at the gate.",
    lat: -12.7932,
    lng: 28.2315,
    address: "Riverside, Kitwe (near CBU Campus)",
    status: "in-progress",
    reportedAt: "2026-07-10T08:30:00Z",
    severity: "high"
  },
  {
    id: "cmp-002",
    type: "maintenance",
    title: "Sewer Blockage / Repair",
    description: "Sewer blockage on the service lane behind the property.",
    lat: -12.7915,
    lng: 28.234,
    address: "Plot 42, Riverside, Kitwe",
    status: "active",
    reportedAt: "2026-07-13T07:15:00Z",
    severity: "medium"
  },
  {
    id: "inc-planned-01",
    type: "maintenance",
    title: "Pump Overhaul & Pipe Replacement",
    description: "Scheduled maintenance by Nkana Water works engineering crew.",
    lat: -12.8120,
    lng: 28.2140,
    address: "Parklands, Kitwe",
    status: "planned",
    reportedAt: "2026-07-12T10:00:00Z",
    severity: "low"
  },
  {
    id: "inc-burst-02",
    type: "outage",
    title: "Emergency Main Transmission Line Repair",
    description: "Major line shutdown on Jambo Drive. Technicians on site.",
    lat: -12.8250,
    lng: 28.2450,
    address: "Jambo Drive, Nkana East, Kitwe",
    status: "active",
    reportedAt: "2026-07-13T08:00:00Z",
    severity: "critical"
  }
];

export default function ServiceStatusMap({
  isHighContrast,
  activeAccountNo,
  triggerRefreshSignal,
  onReportAtLocation
}: ServiceStatusMapProps) {
  const [incidents, setIncidents] = useState<MapIncident[]>(DEFAULT_MAP_INCIDENTS);
  const [filteredIncidents, setFilteredIncidents] = useState<MapIncident[]>(DEFAULT_MAP_INCIDENTS);
  const [filterType, setFilterType] = useState<"all" | "leak" | "outage" | "maintenance">("all");
  const [selectedIncident, setSelectedIncident] = useState<MapIncident | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  // Map view focus coordinates (Kitwe center)
  const defaultCenter = { lat: -12.8030, lng: 28.2250 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

  // Manual mock location reporting state
  const [isReportingClick, setIsReportingClick] = useState(false);

  // Fetch real-time incidents from the backend with retries and fallback
  const fetchIncidents = async () => {
    setIsLoading(true);
    setError("");
    try {
      let res: Response | null = null;
      for (let i = 0; i < 3; i++) {
        try {
          const r = await fetch("/api/map/incidents");
          if (r.ok) {
            res = r;
            break;
          }
        } catch {
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 600));
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setIncidents(data);
          return;
        }
      }
    } catch {
      // Fallback used seamlessly
    } finally {
      setIsLoading(false);
    }

    // Preserve default incidents
    setIncidents(prev => prev.length > 0 ? prev : DEFAULT_MAP_INCIDENTS);
  };

  useEffect(() => {
    fetchIncidents();
  }, [triggerRefreshSignal, refreshCount]);

  // Apply filters
  useEffect(() => {
    if (filterType === "all") {
      setFilteredIncidents(incidents);
    } else {
      setFilteredIncidents(incidents.filter(inc => inc.type === filterType));
    }
  }, [incidents, filterType]);

  // Handle marker focus click
  const handleMarkerClick = (incident: MapIncident) => {
    setSelectedIncident(incident);
    setMapCenter({ lat: incident.lat, lng: incident.lng });
  };

  // Quick center zoom to an incident
  const handleIncidentFocus = (incident: MapIncident) => {
    setSelectedIncident(incident);
    setMapCenter({ lat: incident.lat, lng: incident.lng });
    setMapZoom(15);
  };

  // Helper colors for types
  const getTypeColor = (type: MapIncident["type"]) => {
    switch (type) {
      case "leak": return "text-blue-500 bg-blue-50 border-blue-200";
      case "outage": return "text-red-500 bg-red-50 border-red-200";
      case "maintenance": return "text-amber-500 bg-amber-50 border-amber-200";
    }
  };

  const getSeverityBadgeColor = (severity: MapIncident["severity"]) => {
    switch (severity) {
      case "critical": return "bg-red-600 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-amber-500 text-white";
      case "low": return "bg-blue-500 text-white";
    }
  };

  // Marker colors
  const getMarkerPinColor = (type: MapIncident["type"]) => {
    switch (type) {
      case "leak": return "#2563EB"; // Blue
      case "outage": return "#DC2626"; // Red
      case "maintenance": return "#D97706"; // Amber
    }
  };

  return (
    <div className={`flex flex-col h-full space-y-4 ${isHighContrast ? "text-white" : "text-slate-800"}`}>
      
      {/* Header Info Banner */}
      <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
        isHighContrast 
          ? "bg-black border-white text-white" 
          : "bg-gradient-to-r from-blue-50 to-indigo-50/50 border-blue-100"
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Droplets className="w-5 h-5 text-blue-600 animate-pulse shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider">Service Grid Status Map</h4>
            <p className="text-[9px] text-slate-500 font-medium truncate">Real-time status of water grid in Kitwe</p>
          </div>
        </div>
        <button
          onClick={() => setRefreshCount(prev => prev + 1)}
          disabled={isLoading}
          className={`p-1.5 rounded-lg border transition-all ${
            isHighContrast 
              ? "border-white text-white hover:bg-white/10" 
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
          }`}
          title="Refresh Map Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Toggles and Category Filters */}
      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
        {(["all", "leak", "outage", "maintenance"] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              setFilterType(type);
              setSelectedIncident(null);
            }}
            className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all uppercase ${
              filterType === type
                ? (isHighContrast 
                    ? "bg-black text-white border border-white" 
                    : "bg-white text-blue-700 shadow-sm")
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            {type === "all" ? "All Grid" : type === "leak" ? "Leaks" : type === "outage" ? "Outages" : "Maint."}
          </button>
        ))}
      </div>

      {/* CORE MAP VIEW CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm flex-1 min-h-[280px] bg-slate-100 flex flex-col">
        {hasValidKey ? (
          /* REAL GOOGLE MAPS IMPLEMENTATION */
          <div className="w-full h-full flex-1 relative min-h-[280px]">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                center={mapCenter}
                zoom={mapZoom}
                onCenterChanged={(e) => setMapCenter(e.detail.center)}
                onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
                mapId="DEMO_MAP_ID"
                disableDefaultUI={true}
                zoomControl={true}
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                style={{ width: "100%", height: "100%" }}
                onClick={(e) => {
                  if (isReportingClick && e.detail.latLng && onReportAtLocation) {
                    onReportAtLocation(
                      e.detail.latLng.lat,
                      e.detail.latLng.lng,
                      `Map Coordinates (${e.detail.latLng.lat.toFixed(4)}, ${e.detail.latLng.lng.toFixed(4)})`
                    );
                    setIsReportingClick(false);
                  } else {
                    setSelectedIncident(null);
                  }
                }}
              >
                {filteredIncidents.map((inc) => (
                  <AdvancedMarker
                    key={inc.id}
                    position={{ lat: inc.lat, lng: inc.lng }}
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <Pin 
                      background={getMarkerPinColor(inc.type)} 
                      borderColor="#fff" 
                      glyphColor="#fff"
                      scale={selectedIncident?.id === inc.id ? 1.2 : 1.0}
                    />
                  </AdvancedMarker>
                ))}

                {/* Real Info Window */}
                {selectedIncident && (
                  <InfoWindow
                    position={{ lat: selectedIncident.lat, lng: selectedIncident.lng }}
                    onCloseClick={() => setSelectedIncident(null)}
                  >
                    <div className="p-1.5 max-w-[200px] text-slate-800 space-y-1 font-sans">
                      <div className="flex items-center gap-1">
                        {selectedIncident.type === "leak" && <Droplets className="w-3 h-3 text-blue-500" />}
                        {selectedIncident.type === "outage" && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        {selectedIncident.type === "maintenance" && <Wrench className="w-3 h-3 text-amber-500" />}
                        <span className="font-extrabold text-[10px] uppercase text-slate-900 tracking-tight leading-tight">
                          {selectedIncident.title}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 line-clamp-2 leading-snug">
                        {selectedIncident.description}
                      </p>
                      <div className="text-[8px] text-slate-400 font-medium">
                        📍 {selectedIncident.address}
                      </div>
                      <div className="flex gap-1 pt-1">
                        <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[7px] font-bold uppercase">
                          {selectedIncident.status}
                        </span>
                        <span className="bg-red-50 text-red-600 px-1 py-0.5 rounded text-[7px] font-bold uppercase">
                          {selectedIncident.severity}
                        </span>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>
        ) : (
          /* INTERACTIVE fallBack MOCK MAP ENGINE */
          <div className="w-full h-full flex-1 relative flex flex-col justify-between overflow-hidden bg-slate-900">
            {/* Grid Coordinates BG */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Custom SVG Simulated Blueprint Map of Kitwe Sector */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 350 350">
              {/* Rivers / Pipelines */}
              <path d="M-10 150 C 120 160, 200 80, 360 90" fill="none" stroke="#2563EB" strokeWidth="6" opacity="0.15" />
              <path d="M120 160 C 140 240, 220 280, 260 360" fill="none" stroke="#2563EB" strokeWidth="4" opacity="0.10" />
              
              {/* Road Grids */}
              <line x1="50" y1="0" x2="50" y2="350" stroke="#fff" strokeWidth="0.5" opacity="0.05" />
              <line x1="150" y1="0" x2="150" y2="350" stroke="#fff" strokeWidth="0.5" opacity="0.05" />
              <line x1="250" y1="0" x2="250" y2="350" stroke="#fff" strokeWidth="0.5" opacity="0.05" />
              <line x1="0" y1="100" x2="350" y2="100" stroke="#fff" strokeWidth="0.5" opacity="0.05" />
              <line x1="0" y1="200" x2="350" y2="200" stroke="#fff" strokeWidth="0.5" opacity="0.05" />
              <line x1="0" y1="300" x2="350" y2="300" stroke="#fff" strokeWidth="0.5" opacity="0.05" />
              
              {/* Primary Main Roads */}
              <path d="M0 80 L 350 310" fill="none" stroke="#fff" strokeWidth="2" opacity="0.08" />
              <path d="M100 0 L 260 350" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.08" />
              
              {/* Suburbs bounding shapes */}
              <circle cx="80" cy="110" r="45" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
              <text x="80" y="75" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle" opacity="0.25">RIVERSIDE</text>
              
              <circle cx="270" cy="180" r="50" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
              <text x="270" y="145" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle" opacity="0.25">NKANA EAST</text>

              <circle cx="210" cy="60" r="35" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
              <text x="210" y="35" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle" opacity="0.25">PARKLANDS</text>

              <rect x="20" y="240" width="90" height="70" rx="10" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" opacity="0.1" />
              <text x="65" y="232" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle" opacity="0.25">KITWE CBD</text>
            </svg>

            {/* Simulated Interactive Hotspots on Canvas */}
            <div className="absolute inset-0">
              {filteredIncidents.map((inc) => {
                // Project coordinates (-12.83 to -12.78 and 28.20 to 28.25) to percentage coordinates on screen
                // Simple linear scaling for Kitwe coordinate bounds
                const latMin = -12.8300;
                const latMax = -12.7800;
                const lngMin = 28.2000;
                const lngMax = 28.2500;

                const pctY = 100 - ((inc.lat - latMin) / (latMax - latMin)) * 100;
                const pctX = ((inc.lng - lngMin) / (lngMax - lngMin)) * 100;

                const isSelected = selectedIncident?.id === inc.id;

                return (
                  <button
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    style={{
                      top: `${Math.max(8, Math.min(92, pctY))}%`,
                      left: `${Math.max(8, Math.min(92, pctX))}%`,
                      transform: "translate(-50%, -50%)"
                    }}
                    className="absolute group z-20 focus:outline-none"
                  >
                    {/* Ring Pulse */}
                    <span className={`absolute inline-flex h-7 w-7 rounded-full opacity-65 animate-ping -top-1.5 -left-1.5 ${
                      inc.type === "leak" ? "bg-blue-500" : inc.type === "outage" ? "bg-red-500" : "bg-amber-500"
                    }`}></span>

                    {/* Dot Pin */}
                    <div className={`w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-all ${
                      isSelected ? "scale-125 z-30" : "hover:scale-110"
                    } ${
                      inc.type === "leak" ? "bg-blue-600 text-white" : inc.type === "outage" ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                    }`}>
                      {inc.type === "leak" && <Droplets className="w-2.5 h-2.5" />}
                      {inc.type === "outage" && <AlertTriangle className="w-2.5 h-2.5" />}
                      {inc.type === "maintenance" && <Wrench className="w-2.5 h-2.5" />}
                    </div>

                    {/* Quick Micro Tag */}
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 bg-black/90 text-[8px] font-bold text-white px-1.5 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap transition-transform duration-150 z-35">
                      {inc.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Interactive Click to Report Simulation */}
            {isReportingClick && (
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  // Map pixels back to coordinates
                  const pctX = x / rect.width;
                  const pctY = 1 - (y / rect.height);

                  const latMin = -12.8300;
                  const latMax = -12.7800;
                  const lngMin = 28.2000;
                  const lngMax = 28.2500;

                  const lat = latMin + pctY * (latMax - latMin);
                  const lng = lngMin + pctX * (lngMax - lngMin);

                  if (onReportAtLocation) {
                    onReportAtLocation(
                      lat,
                      lng,
                      `Custom Map Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`
                    );
                    setIsReportingClick(false);
                  }
                }}
                className="absolute inset-0 bg-blue-500/10 cursor-crosshair z-25 flex items-center justify-center border-2 border-dashed border-blue-500"
              >
                <div className="bg-slate-900/90 text-white text-[9.5px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
                  Tap anywhere on the grid to Geotag a leak report!
                </div>
              </div>
            )}

            {/* Simulated Map Controls overlay */}
            <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md rounded-xl p-2.5 border border-white/10 text-white space-y-1 z-22 max-w-[190px]">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                <span className="text-[9.5px] font-black uppercase font-display tracking-wider text-cyan-400">Kitwe Simulated Grid</span>
              </div>
              <p className="text-[8px] text-slate-300 leading-normal font-medium">
                Google Maps API offline. Displaying high-fidelity local vector GIS grid.
              </p>
            </div>

            {/* Quick API Key Setup Warning Notice */}
            <div className="absolute bottom-2 inset-x-2 bg-slate-900/95 backdrop-blur-md rounded-xl p-2 border border-yellow-500/30 text-white flex items-center justify-between gap-2 z-22">
              <div className="flex items-center gap-1.5 min-w-0">
                <Info className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                <p className="text-[8px] text-slate-300 truncate font-medium">
                  Add <code className="text-yellow-400 font-bold font-mono">GOOGLE_MAPS_PLATFORM_KEY</code> secret for real map.
                </p>
              </div>
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noreferrer"
                className="px-2 py-0.5 bg-yellow-500 text-black font-extrabold text-[7.5px] rounded uppercase hover:bg-yellow-400 shrink-0"
              >
                Get Key
              </a>
            </div>
          </div>
        )}

        {/* DETAILS POPUP FOR SELECTED INCIDENT */}
        {selectedIncident && (
          <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 shadow-xl p-3.5 z-40 animate-in slide-in-from-bottom duration-250 font-sans text-slate-800 rounded-t-2xl">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[7.5px] font-bold uppercase ${getSeverityBadgeColor(selectedIncident.severity)}`}>
                  {selectedIncident.severity}
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">{selectedIncident.type}</span>
              </div>
              <button 
                onClick={() => setSelectedIncident(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <h5 className="text-[11.5px] font-extrabold text-slate-900 tracking-tight">{selectedIncident.title}</h5>
            <p className="text-[9.5px] text-slate-600 mt-1 leading-relaxed font-medium">
              {selectedIncident.description}
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400 font-semibold uppercase">
              <span className="truncate max-w-[150px]">📍 {selectedIncident.address}</span>
              <span>Reported: {new Date(selectedIncident.reportedAt).toLocaleDateString()}</span>
            </div>

            {selectedIncident.status !== "resolved" && (
              <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-150 p-2 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Status: {selectedIncident.status}</span>
                </div>
                
                {selectedIncident.type === "leak" && (
                  <span className="text-[8px] text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    Technician Assigned
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUICK REPORT ACTION & INCIDENT LIST */}
      <div className="space-y-2 shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quick Report & Dispatch</span>
          {onReportAtLocation && (
            <button
              onClick={() => setIsReportingClick(!isReportingClick)}
              className={`text-[9px] font-extrabold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                isReportingClick
                  ? "bg-red-500 text-white"
                  : (isHighContrast 
                      ? "bg-white text-black hover:bg-slate-200" 
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm")
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {isReportingClick ? "Cancel Report" : "Geotag Leak"}
            </button>
          )}
        </div>

        {/* Scrollable incidents feed */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {filteredIncidents.length === 0 ? (
            <div className="text-[9px] text-slate-400 py-3 w-full text-center font-medium">
              No matching grid incidents found.
            </div>
          ) : (
            filteredIncidents.slice(0, 4).map((inc) => {
              const typeColor = getTypeColor(inc.type);
              return (
                <button
                  key={inc.id}
                  onClick={() => handleIncidentFocus(inc)}
                  className={`flex-none w-[130px] p-2 rounded-xl border text-left space-y-1 transition-all ${
                    isHighContrast 
                      ? "bg-black border-white text-white hover:bg-white/10" 
                      : "bg-white border-slate-200/60 hover:border-blue-300 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold border uppercase ${typeColor}`}>
                      {inc.type}
                    </span>
                    <span className="text-[7.5px] text-slate-400 font-mono">#{inc.id}</span>
                  </div>
                  <h6 className="text-[9.5px] font-bold truncate text-slate-800 leading-tight block">
                    {inc.title}
                  </h6>
                  <p className="text-[8px] text-slate-400 truncate leading-none block">
                    {inc.address}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
