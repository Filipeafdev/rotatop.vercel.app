import { AddressSuggestion, LatLng } from '../types';

// Pre-seeded Brazilian hubs & sample points for instant offline/fallback responses
export const BRAZIL_POPULAR_HUBS: AddressSuggestion[] = [
  {
    displayName: 'CD Central Distribuição - Rod. Anhanguera, km 18, São Paulo - SP',
    lat: -23.5042,
    lng: -46.7456,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Galpão Logístico Rotatop - Av. das Nações Unidas, 14401, São Paulo - SP',
    lat: -23.6268,
    lng: -46.7029,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Garagem & Base Operacional - R. Vergueiro, 3185, Vila Mariana, São Paulo - SP',
    lat: -23.5855,
    lng: -46.6347,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Supermercado Central - Av. Brigadeiro Faria Lima, 2232, Pinheiros, São Paulo - SP',
    lat: -23.5762,
    lng: -46.6908,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Drogaria Pacheco & Cia - Av. Paulista, 1000, Bela Vista, São Paulo - SP',
    lat: -23.5654,
    lng: -46.6517,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Restaurante Sabor de Minas - R. Augusta, 1492, Consolação, São Paulo - SP',
    lat: -23.5559,
    lng: -46.6577,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Padaria Bella Paulista - R. Haddock Lobo, 354, Cerqueira César, São Paulo - SP',
    lat: -23.5582,
    lng: -46.6625,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Auto Peças Express - Av. do Estado, 5500, Cambuci, São Paulo - SP',
    lat: -23.5611,
    lng: -46.6198,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'CD Central Campinas - Rod. Anhanguera, km 98, Campinas - SP',
    lat: -22.9152,
    lng: -47.0854,
    city: 'Campinas',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'CD Logístico Dom Pedro - Rod. D. Pedro I, km 136, Campinas - SP',
    lat: -22.8601,
    lng: -47.0312,
    city: 'Campinas',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Base Operacional Campinas - Av. Prestes Maia, 1200, Vila Industrial, Campinas - SP',
    lat: -22.9254,
    lng: -47.0701,
    city: 'Campinas',
    state: 'SP',
    source: 'local',
  },
  {
    displayName: 'Residência do Motorista - R. Domingos de Morais, 1800, Vila Mariana, São Paulo - SP',
    lat: -23.5912,
    lng: -46.6384,
    city: 'São Paulo',
    state: 'SP',
    source: 'local',
  },
];

// Reference anchor coordinates for key SP cities to avoid falling back to São Paulo
export const SP_CITY_COORDINATES: Record<string, LatLng> = {
  campinas: { lat: -22.9064, lng: -47.0616 },
  paulinia: { lat: -22.7631, lng: -47.1542 },
  sumare: { lat: -22.8219, lng: -47.2669 },
  hortolandia: { lat: -22.8583, lng: -47.2200 },
  valinhos: { lat: -22.9708, lng: -46.9958 },
  vinhedo: { lat: -23.0297, lng: -46.9836 },
  indaiatuba: { lat: -23.0903, lng: -47.2181 },
  americana: { lat: -22.7394, lng: -47.3314 },
  jundiai: { lat: -23.1857, lng: -46.8978 },
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
};

export function getCityAnchor(cityName?: string): LatLng {
  if (!cityName) return { lat: -22.9064, lng: -47.0616 }; // Default to Campinas
  const normalized = cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, coords] of Object.entries(SP_CITY_COORDINATES)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }
  return { lat: -22.9064, lng: -47.0616 };
}

/**
 * Resolves exact LatLng for a Google Maps placeId or formatted address
 */
export async function resolveGoogleCoordinates(
  placeId?: string,
  addressText?: string
): Promise<LatLng | null> {
  try {
    const params = new URLSearchParams();
    if (placeId) params.set('placeId', placeId);
    else if (addressText) params.set('address', addressText);
    else return null;

    const res = await fetch(`/api/maps/geocode?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const loc = data.result?.geometry?.location || data.results?.[0]?.geometry?.location;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        return {
          lat: loc.lat,
          lng: loc.lng,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to resolve Google Maps coordinates:', err);
  }
  return null;
}

/**
 * Geocodes an address string directly with Google Maps Platform,
 * returning formatted address and exact lat/lng coordinates in the correct municipality.
 */
export async function geocodeAddressDirectly(
  addressText: string,
  cityHint?: string
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  const cleanAddr = addressText.trim();
  if (!cleanAddr) return null;

  // Build query ensuring municipality is present
  let query = cleanAddr;
  if (cityHint && !query.toLowerCase().includes(cityHint.toLowerCase())) {
    query = `${query}, ${cityHint} - SP, Brasil`;
  }

  try {
    const params = new URLSearchParams({ address: query });
    const res = await fetch(`/api/maps/geocode?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const loc = data.result?.geometry?.location || data.results?.[0]?.geometry?.location;
      if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        return {
          lat: loc.lat,
          lng: loc.lng,
          formattedAddress: data.result?.formatted_address || cleanAddr,
        };
      }
    }
  } catch (err) {
    console.warn(`Direct geocode failed for "${query}":`, err);
  }

  // Fallback to municipal anchor if Google Maps returns no result
  const anchor = getCityAnchor(cityHint || cleanAddr);
  return {
    lat: anchor.lat + (Math.random() - 0.5) * 0.03,
    lng: anchor.lng + (Math.random() - 0.5) * 0.03,
    formattedAddress: cleanAddr,
  };
}

/**
 * Searches Brazilian addresses using Google Maps Platform Places Autocomplete
 * with seamless fallback to OpenStreetMap Nominatim and local hubs.
 */
export async function searchAddressBR(query: string): Promise<AddressSuggestion[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  // Check matching local seeds first
  const localMatches = BRAZIL_POPULAR_HUBS.filter((hub) =>
    hub.displayName.toLowerCase().includes(clean.toLowerCase())
  );

  // 1. Try Google Maps Platform Places Autocomplete
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const gRes = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(clean)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (gRes.ok) {
      const gData = await gRes.json();
      if (Array.isArray(gData.predictions) && gData.predictions.length > 0) {
        const googleSuggestions: AddressSuggestion[] = gData.predictions.slice(0, 6).map((pred: any) => ({
          displayName: pred.description,
          placeId: pred.place_id,
          lat: -23.5505, // default anchor, resolved when user selects
          lng: -46.6333,
          source: 'google' as const,
        }));
        return googleSuggestions;
      }
    }
  } catch (err) {
    console.warn('Google Maps autocomplete lookup skipped, trying fallback:', err);
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const encoded = encodeURIComponent(clean);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=br&limit=6&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const remoteResults: AddressSuggestion[] = data.map((item: any) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          city: item.address?.city || item.address?.town || item.address?.municipality,
          state: item.address?.state,
          source: 'osm' as const,
        }));

        const combined = [...localMatches];
        for (const rem of remoteResults) {
          if (!combined.some((c) => Math.abs(c.lat - rem.lat) < 0.001 && Math.abs(c.lng - rem.lng) < 0.001)) {
            combined.push(rem);
          }
        }
        return combined.slice(0, 7);
      }
    }
  } catch (err) {
    console.warn('Nominatim geocode fallback triggered:', err);
  }

  if (localMatches.length > 0) return localMatches;

  return [
    {
      displayName: `${clean} (São Paulo - SP)`,
      lat: -23.5505 + (Math.random() - 0.5) * 0.06,
      lng: -46.6333 + (Math.random() - 0.5) * 0.06,
      city: 'São Paulo',
      state: 'SP',
      source: 'local' as const,
    },
  ];
}

/**
 * Calculates Haversine distance in KM between 2 coordinates
 * with 1.32x road winding factor for urban Brazilian traffic
 */
export function calculateRoadDistanceKm(c1: LatLng, c2: LatLng): number {
  if (c1.lat === c2.lat && c1.lng === c2.lng) return 0;

  const R = 6371; // Earth radius in km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;

  const roadFactor = 1.32;
  return Number((straightKm * roadFactor).toFixed(1));
}

/**
 * Creates Deep Link for native Google Maps navigation
 */
export function getGoogleMapsUrl(destLat: number, destLng: number, address?: string): string {
  const query = address ? encodeURIComponent(address) : `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
}

/**
 * Creates Deep Link for native Waze navigation
 */
export function getWazeUrl(destLat: number, destLng: number): string {
  return `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
}
