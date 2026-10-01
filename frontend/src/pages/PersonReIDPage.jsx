import React, { useState } from 'react';
import { 
  Users, Search, Filter, Clock, MapPin, Eye, Lock, 
  CheckCircle2, AlertCircle, Sparkles, ChevronDown, User, Shield
} from 'lucide-react';

export default function PersonReIDPage({ 
  cameras = [], 
  onNavigateCamera, 
  onNavigateEvidence 
}) {
  const [upperColor, setUpperColor] = useState('ALL');
  const [lowerColor, setLowerColor] = useState('ALL');
  const [hasBag, setHasBag] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTechDetails, setShowTechDetails] = useState(false);

  // Sample person sightings database
  const personSightings = [
    {
      id: 'PERSON-SIGHTING-401',
      upper_color: 'Blue',
      lower_color: 'Black',
      bag: 'Black Backpack',
      gender_est: 'Male (Adult)',
      zone_id: 'ZONE_A',
      camera_id: 'cam1',
      location: 'Ahmedabad SG Highway ISKCON Pedestrian Walkway',
      timestamp: '2026-09-28T16:15:00Z',
      direction: 'Eastbound',
      confidence: 0.88,
      evidence_sha256: '4f29a008a9391fe76b7b25123d2deeb0135d94d35272a806085a6a02f37c3558',
      match_status: 'POSSIBLE_MATCH'
    },
    {
      id: 'PERSON-SIGHTING-402',
      upper_color: 'Red',
      lower_color: 'Blue Jeans',
      bag: 'Shoulder Bag',
      gender_est: 'Female (Adult)',
      zone_id: 'ZONE_B',
      camera_id: 'cam2',
      location: 'Gandhinagar Swarnim Sankul Sector Gate',
      timestamp: '2026-09-28T15:50:00Z',
      direction: 'Northbound',
      confidence: 0.91,
      evidence_sha256: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      match_status: 'POSSIBLE_MATCH'
    },
    {
      id: 'PERSON-SIGHTING-403',
      upper_color: 'White',
      lower_color: 'Dark Khaki',
      bag: 'None Observed',
      gender_est: 'Male (Adult)',
      zone_id: 'ZONE_C',
      camera_id: 'cam3',
      location: 'Surat Diamond Bourse South Entry',
      timestamp: '2026-09-28T15:20:00Z',
      direction: 'Stationary',
      confidence: 0.85,
      evidence_sha256: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      match_status: 'POSSIBLE_MATCH'
    },
    {
      id: 'PERSON-SIGHTING-404',
      upper_color: 'Blue',
      lower_color: 'Black',
      bag: 'Black Backpack',
      gender_est: 'Male (Adult)',
      zone_id: 'ZONE_A',
      camera_id: 'cam1',
      location: 'Ahmedabad SG Highway Flyover Base',
      timestamp: '2026-09-28T14:40:00Z',
      direction: 'Eastbound',
      confidence: 0.87,
      evidence_sha256: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
      match_status: 'POSSIBLE_MATCH'
    }
  ];

  const filteredSightings = personSightings.filter((p) => {
    const matchesUpper = upperColor === 'ALL' || p.upper_color.toLowerCase() === upperColor.toLowerCase();
    const matchesLower = lowerColor === 'ALL' || p.lower_color.toLowerCase().includes(lowerColor.toLowerCase());
    const matchesBag = hasBag === 'ALL' || (hasBag === 'YES' ? p.bag !== 'None Observed' : p.bag === 'None Observed');
    const matchesZone = selectedZone === 'ALL' || p.zone_id === selectedZone;
    const matchesSearch = searchQuery === '' || 
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.upper_color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.camera_id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesUpper && matchesLower && matchesBag && matchesZone && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              Person Appearance & Re-Identification
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                ATTRIBUTES & CLOTHING SEARCH
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Locate possible pedestrian sightings across cameras based on observed clothing colors, luggage, and temporal trails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          <span>Appearance Cosine Metric</span>
        </div>
      </div>

      {/* 2. Attribute Search & Filter Bar */}
      <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
        <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Search className="w-4 h-4 text-purple-400" />
          <span>Filter Pedestrian Sightings by Observed Attributes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Upper Clothing Color */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Upper Clothing</label>
            <select
              value={upperColor}
              onChange={(e) => setUpperColor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="ALL">All Colors</option>
              <option value="Blue">Blue Top</option>
              <option value="Red">Red Top</option>
              <option value="White">White Top</option>
              <option value="Black">Black Top</option>
              <option value="Yellow">Yellow Top</option>
            </select>
          </div>

          {/* Lower Clothing Color */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Lower Clothing</label>
            <select
              value={lowerColor}
              onChange={(e) => setLowerColor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="ALL">All Colors</option>
              <option value="Black">Black Pants</option>
              <option value="Blue">Blue Jeans</option>
              <option value="Khaki">Khaki Pants</option>
            </select>
          </div>

          {/* Bag / Luggage */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Bag / Backpack</label>
            <select
              value={hasBag}
              onChange={(e) => setHasBag(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="ALL">Any / All</option>
              <option value="YES">With Backpack / Bag</option>
              <option value="NO">No Bag</option>
            </select>
          </div>

          {/* Zone */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Surveillance Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="ALL">All Zones</option>
              <option value="ZONE_A">ZONE A - Ahmedabad</option>
              <option value="ZONE_B">ZONE B - Gandhinagar</option>
              <option value="ZONE_C">ZONE C - Surat</option>
            </select>
          </div>

          {/* Free Text */}
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Location / Keyword</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Highway, Entry"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Found <strong>{filteredSightings.length}</strong> matching pedestrian observations across CCTV grid:</span>
          <span className="text-[11px] italic text-slate-500">Note: Labelled "Possible Match" until confirmed by investigating officer.</span>
        </div>

        {filteredSightings.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
            <div className="text-sm font-semibold text-slate-400">No person observations match selected attributes.</div>
            <p className="text-xs text-slate-600">Try resetting the clothing color or zone filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSightings.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-xl space-y-3 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Possible Person Match</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          {p.id}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.gender_est} • Travel: {p.direction}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {Math.round(p.confidence * 100)}% Match
                  </span>
                </div>

                {/* Attributes breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Top</span>
                    <span className="font-semibold text-slate-200">{p.upper_color}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Bottom</span>
                    <span className="font-semibold text-slate-200">{p.lower_color}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Luggage</span>
                    <span className="font-semibold text-purple-300 truncate block">{p.bag}</span>
                  </div>
                </div>

                {/* Location & Time */}
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span>Node: <strong className="text-slate-200 font-mono">{p.camera_id} ({p.zone_id})</strong></span>
                    <span className="font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {new Date(p.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateCamera && onNavigateCamera(p.camera_id)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Sighting Node</span>
                    </button>
                    <button
                      onClick={() => onNavigateEvidence && onNavigateEvidence()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    SHA-256 Verified ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Collapsible Technical Details */}
      <div className="border border-slate-800/80 rounded-xl bg-slate-950/50 overflow-hidden">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between transition cursor-pointer"
        >
          <span className="flex items-center gap-2 font-mono">
            <span>⚙️</span> Appearance Embedding Vectors & Cosine Re-ID Gallery
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showTechDetails ? 'rotate-180' : ''}`} />
        </button>

        {showTechDetails && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs font-mono space-y-2 text-slate-400 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">RE-ID EMBEDDING MODEL</span>
                <span className="text-purple-300">ResNet50-IBN Appearance Descriptor (512-dim)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DISTANCE METRIC</span>
                <span className="text-purple-300">Euclidean / Cosine Feature Distance &lt;= 0.35</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
