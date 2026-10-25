import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Route, Stop } from '../../types';
import { getGoogleMapsUrl, getWazeUrl } from '../../lib/geocoding';
import { ExternalLink, MapPin, Navigation, Compass } from 'lucide-react';

interface RouteMapProps {
  route: Route;
  activeStopId?: string;
  onSelectStop?: (stop: Stop) => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({ route, activeStopId, onSelectStop }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet map
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([route.startCoords.lat, route.startCoords.lng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const latLngBounds: L.LatLngExpression[] = [];

    // Helper to create custom HTML DivIcon
    const createCustomIcon = (label: string, bgClass: string, isCurrent: boolean = false) => {
      const ringClass = isCurrent ? 'ring-4 ring-amber-400 scale-110 animate-bounce' : 'shadow-lg';
      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-xs ${bgClass} ${ringClass} transition-all border-2 border-slate-900 shadow-md">
            ${label}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });
    };

    // 1. Start Marker (S - Saída da Empresa)
    const startLatLng: [number, number] = [route.startCoords.lat, route.startCoords.lng];
    latLngBounds.push(startLatLng);

    const startMarker = L.marker(startLatLng, {
      icon: createCustomIcon('S', 'bg-emerald-600'),
    }).bindPopup(`
      <div class="p-1 font-sans text-slate-900 min-w-[180px]">
        <div class="flex items-center gap-1.5 font-bold text-emerald-700 text-xs uppercase tracking-wider">
          <span>🏢 Saída (Base / CD)</span>
        </div>
        <p class="text-xs text-slate-700 mt-1 font-medium leading-tight">${route.startAddress}</p>
        <div class="mt-2 text-[10px] bg-emerald-50 text-emerald-800 rounded px-2 py-0.5 inline-block font-semibold">
          Ponto de Partida
        </div>
      </div>
    `);
    layerGroup.addLayer(startMarker);

    // 2. Stops Markers (1, 2, 3...)
    const orderedStops = [...route.stops].sort((a, b) => a.sequenceIndex - b.sequenceIndex);

    orderedStops.forEach((stop) => {
      const isCurrent = stop.id === activeStopId;
      const stopLatLng: [number, number] = [stop.lat, stop.lng];
      latLngBounds.push(stopLatLng);

      let badgeBg = 'bg-blue-600';
      if (stop.status === 'entregue') badgeBg = 'bg-emerald-500';
      if (stop.status === 'cancelada') badgeBg = 'bg-rose-600';
      if (stop.status === 'reentregar') badgeBg = 'bg-amber-500';

      const gMapsUrl = getGoogleMapsUrl(stop.lat, stop.lng, stop.address);
      const wazeUrl = getWazeUrl(stop.lat, stop.lng);

      const marker = L.marker(stopLatLng, {
        icon: createCustomIcon(`${stop.sequenceIndex}`, badgeBg, isCurrent),
      }).bindPopup(`
        <div class="p-2 font-sans text-slate-900 min-w-[220px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
            <span class="font-extrabold text-sm text-slate-900">#${stop.sequenceIndex} ${stop.clientName}</span>
            ${
              stop.isPriority
                ? '<span class="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Prioridade</span>'
                : ''
            }
          </div>
          <p class="text-xs text-slate-600 mt-1.5 line-clamp-2">${stop.address}</p>
          <div class="grid grid-cols-2 gap-1 my-2 bg-slate-100 p-1.5 rounded text-[11px]">
            <div><span class="text-slate-500">Valor:</span> <strong class="text-emerald-700">R$ ${stop.orderValue.toFixed(2)}</strong></div>
            <div><span class="text-slate-500">Peso:</span> <strong class="text-slate-800">${stop.totalWeight} kg</strong></div>
            <div class="col-span-2 capitalize"><span class="text-slate-500">Status:</span> <strong>${stop.status}</strong></div>
          </div>
          ${stop.notes ? `<p class="text-[10px] text-amber-800 bg-amber-50 p-1 rounded border border-amber-200 mb-2">⚠️ ${stop.notes}</p>` : ''}
          <div class="flex items-center gap-1.5 pt-1 border-t border-slate-200">
            <a href="${gMapsUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 rounded flex items-center justify-center gap-1 no-underline">
              Google Maps
            </a>
            <a href="${wazeUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold py-1.5 rounded flex items-center justify-center gap-1 no-underline">
              Waze
            </a>
          </div>
        </div>
      `);

      if (onSelectStop) {
        marker.on('click', () => onSelectStop(stop));
      }

      layerGroup.addLayer(marker);
    });

    // 3. End Marker (F - Final / Residência)
    const endLatLng: [number, number] = [route.endCoords.lat, route.endCoords.lng];
    latLngBounds.push(endLatLng);

    const endMarker = L.marker(endLatLng, {
      icon: createCustomIcon('F', 'bg-purple-600'),
    }).bindPopup(`
      <div class="p-1 font-sans text-slate-900 min-w-[180px]">
        <div class="flex items-center gap-1.5 font-bold text-purple-700 text-xs uppercase tracking-wider">
          <span>🏠 Fim (Casa / Garagem)</span>
        </div>
        <p class="text-xs text-slate-700 mt-1 font-medium leading-tight">${route.endAddress}</p>
        <div class="mt-2 text-[10px] bg-purple-50 text-purple-800 rounded px-2 py-0.5 inline-block font-semibold">
          Destino Final
        </div>
      </div>
    `);
    layerGroup.addLayer(endMarker);

    // 4. Polylines
    // Leg 1: Unproductive (Start -> Stop 1)
    if (orderedStops.length > 0) {
      const leg1 = L.polyline([startLatLng, [orderedStops[0].lat, orderedStops[0].lng]], {
        color: '#94a3b8',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.85,
      });
      layerGroup.addLayer(leg1);

      // Leg 2: Productive (Stop 1 -> Stop N)
      if (orderedStops.length > 1) {
        const prodPoints: [number, number][] = orderedStops.map((s) => [s.lat, s.lng]);
        const legProductive = L.polyline(prodPoints, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.95,
        });
        layerGroup.addLayer(legProductive);
      }

      // Leg 3: Unproductive Return (Stop N -> End)
      const lastStop = orderedStops[orderedStops.length - 1];
      const leg3 = L.polyline([[lastStop.lat, lastStop.lng], endLatLng], {
        color: '#c084fc',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.85,
      });
      layerGroup.addLayer(leg3);
    } else {
      // Direct polyline start to end
      const direct = L.polyline([startLatLng, endLatLng], {
        color: '#94a3b8',
        weight: 3,
        dashArray: '4, 6',
      });
      layerGroup.addLayer(direct);
    }

    // Auto-fit bounds
    if (latLngBounds.length > 0) {
      map.fitBounds(L.latLngBounds(latLngBounds), {
        padding: [30, 30],
        maxZoom: 15,
      });
    }
  }, [route, activeStopId, onSelectStop]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const latLngBounds: [number, number][] = [
      [route.startCoords.lat, route.startCoords.lng],
      ...route.stops.map((s): [number, number] => [s.lat, s.lng]),
      [route.endCoords.lat, route.endCoords.lng],
    ];
    mapInstanceRef.current.fitBounds(L.latLngBounds(latLngBounds), {
      padding: [35, 35],
    });
  };

  return (
    <div className="relative w-full h-[360px] md:h-[450px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Overlay Badge & Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs flex items-center gap-2 shadow-lg">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-300 font-medium">S: Saída</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span className="text-slate-300 font-medium">1..{route.stops.length}: Paradas</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
            <span className="text-slate-300 font-medium">F: Casa</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleRecenter}
        title="Centralizar Rota Completa"
        className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 hover:bg-slate-800 text-white p-2.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-1.5 text-xs font-semibold backdrop-blur-sm transition-all"
      >
        <Compass className="w-4 h-4 text-amber-400" />
        <span>Centralizar Rota</span>
      </button>

      {/* Legend Indicator for Productive / Improductive */}
      <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-500 inline-block"></span>
          <span>KM Produtivo ({route.productiveKm} km)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-slate-400 border-b border-dashed border-slate-300 inline-block"></span>
          <span>KM Vazio ({route.unproductiveKm} km)</span>
        </div>
      </div>
    </div>
  );
};
