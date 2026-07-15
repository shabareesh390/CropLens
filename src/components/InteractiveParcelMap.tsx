import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const vertexIcon = L.divIcon({
  className: "vertex-icon",
  html: `<div style="width: 14px; height: 14px; background: #fff; border: 3px solid #7FD9A1; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const gpsIcon = L.divIcon({
  className: "gps-icon",
  html: `<div style="width: 16px; height: 16px; background: #4285F4; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(66,133,244,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function InteractiveParcelMap({ rorId, district, confirmed }: { rorId: string; district: string; confirmed: boolean }) {
  const seed = (rorId + district).split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBlueDot, setShowBlueDot] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibQuery, setCalibQuery] = useState("");

  const locateMe = () => {
    // 1. Check if we have a calibrated GPS bypass (for laptops)
    const bypass = localStorage.getItem("demo_gps_bypass");
    if (bypass) {
      const [lat, lng] = JSON.parse(bypass);
      setUserCenter([lat, lng]);
      setShowBlueDot(true);
      return;
    }

    // 2. Otherwise try real hardware GPS
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      alert("Your browser does not support geolocation.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCenter([pos.coords.latitude, pos.coords.longitude]);
        setShowBlueDot(true);
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        alert("Could not get exact GPS location. Please calibrate your GPS using the settings icon.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleCalibrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calibQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(calibQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        localStorage.setItem("demo_gps_bypass", JSON.stringify([parseFloat(data[0].lat), parseFloat(data[0].lon)]));
        setIsCalibrating(false);
        alert("GPS successfully calibrated! The locate button will now use this exact location.");
      } else {
        alert("Location not found. Try a broader search.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setUserCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setShowBlueDot(false); // Hide GPS dot if they manually searched
      } else {
        alert("Could not find that exact location. Try a broader area or nearby landmark.");
      }
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  const { center, initialPolygon } = useMemo(() => {
    let lat = 14 + (seed % 300) / 100;
    let lng = 74 + (seed % 400) / 100;

    if (userCenter) {
      lat = userCenter[0];
      lng = userCenter[1];
    }
    
    const offset1 = (seed % 10) / 10000;
    const offset2 = ((seed * 2) % 15) / 10000;
    return {
      center: [lat, lng] as [number, number],
      initialPolygon: [
        [lat + 0.001 + offset1, lng - 0.001 - offset2] as [number, number],
        [lat + 0.0015 + offset2, lng + 0.001 + offset1] as [number, number],
        [lat - 0.001 - offset1, lng + 0.0015 + offset2] as [number, number],
        [lat - 0.0005 - offset2, lng - 0.001 - offset1] as [number, number]
      ]
    };
  }, [seed, userCenter]);

  const [vertices, setVertices] = useState(initialPolygon);

  // Reset vertices when RoR ID changes
  useEffect(() => {
    setVertices(initialPolygon);
  }, [initialPolygon]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {!confirmed && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type your exact address, village, or landmark..." 
            className="flex-1 px-3 py-1.5 rounded-lg border text-[0.85rem] bg-transparent outline-none focus:border-[var(--brand)]"
            style={{ borderColor: "var(--border-soft)", color: "var(--ink-base)" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4 py-1.5 rounded-lg text-[0.85rem] font-semibold">
            Locate
          </button>
        </form>
      )}
      <div className="relative rounded-[14px] overflow-hidden flex-1 min-h-[250px]" style={{ background: "#13361F", aspectRatio: "16/10" }}>
        <MapContainer center={center} zoom={15} style={{ width: "100%", height: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
        />
        <Polygon 
          positions={vertices} 
          pathOptions={{ 
            color: confirmed ? "#7FD9A1" : "#FFC107", 
            fillColor: confirmed ? "#7FD9A1" : "#FFC107", 
            fillOpacity: 0.4,
            dashArray: confirmed ? "0" : "6 4"
          }} 
        />
        
        {!confirmed && vertices.map((pos, i) => (
          <Marker
            key={i}
            position={pos}
            draggable={true}
            icon={vertexIcon}
            eventHandlers={{
              drag: (e) => {
                const newPos = e.target.getLatLng();
                setVertices(prev => {
                  const next = [...prev];
                  next[i] = [newPos.lat, newPos.lng];
                  return next;
                });
              }
            }}
          />
        ))}

        {userCenter && showBlueDot && <Marker position={userCenter} icon={gpsIcon} interactive={false} />}

        <MapUpdater center={center} />
      </MapContainer>
      
      <div className="absolute top-3 left-3 z-[400] mono text-[0.68rem] px-2 py-1 rounded-md text-white pointer-events-none"
        style={{ background: "rgba(10,25,15,.65)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.12)" }}>
        {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E
      </div>
      
      {!confirmed && (
        <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2 items-end">
          {isCalibrating && (
            <form onSubmit={handleCalibrate} className="bg-white p-2 rounded-lg shadow-lg flex gap-2 mb-1" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              <input 
                type="text" 
                placeholder="Type your real home address to calibrate..." 
                className="px-2 py-1 text-[0.8rem] outline-none min-w-[200px]"
                value={calibQuery}
                onChange={e => setCalibQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="bg-[#4285F4] text-white px-3 rounded text-[0.8rem] font-medium">Save</button>
              <button type="button" onClick={() => setIsCalibrating(false)} className="px-2 text-gray-500 text-[0.8rem]">Cancel</button>
            </form>
          )}
          
          <div className="flex gap-2 items-center">
            <button 
              type="button"
              onClick={() => setIsCalibrating(!isCalibrating)}
              title="Calibrate Laptop GPS"
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-gray-100"
            >
              <span className="text-[0.9rem]">⚙️</span>
            </button>
            <button 
              type="button"
              onClick={locateMe}
              disabled={isLocating}
              title="Find My Location"
              className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
              style={{ border: "1px solid rgba(0,0,0,0.1)" }}
            >
              {isLocating ? (
                <div className="w-5 h-5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4 12H2M22 12h-2M12 18a6 6 0 100-12 6 6 0 000 12z" />
                  <circle cx="12" cy="12" r="2" fill="#444" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {!confirmed && (
        <div className="absolute bottom-4 left-3 z-[400] text-[0.75rem] px-3 py-1.5 rounded-lg font-semibold text-white pointer-events-none"
          style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}>
          Drag the corner pins to adjust boundary
        </div>
      )}
      </div>
    </div>
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 15); }, [center, map]);
  return null;
}
