import { LatLng, Stop } from '../types';
import { calculateRoadDistanceKm } from './geocoding';

export interface OptimizationResult {
  orderedStops: Stop[];
  productiveKm: number;
  unproductiveKm: number;
  totalKm: number;
  estimatedFuelCost: number;
  costPerKm: number;
}

/**
 * Optimizes the delivery sequence starting from startCoords,
 * executing priority deliveries first, applying Nearest-Neighbor TSP,
 * and computing productive vs unproductive kilometers to driver residence.
 */
export function optimizeRouteStops(
  stops: Stop[],
  startCoords: LatLng,
  endCoords: LatLng,
  avgKmLiter: number = 8.5,
  fuelPrice: number = 6.29
): OptimizationResult {
  if (stops.length === 0) {
    const directKm = calculateRoadDistanceKm(startCoords, endCoords);
    const fuelCost = avgKmLiter > 0 ? (directKm / avgKmLiter) * fuelPrice : 0;
    return {
      orderedStops: [],
      productiveKm: 0,
      unproductiveKm: directKm,
      totalKm: directKm,
      estimatedFuelCost: Number(fuelCost.toFixed(2)),
      costPerKm: directKm > 0 ? Number((fuelCost / directKm).toFixed(2)) : 0,
    };
  }

  // Split into priority stops and regular stops
  const pendingStops = [...stops];
  const priorityStops = pendingStops.filter((s) => s.isPriority);
  const normalStops = pendingStops.filter((s) => !s.isPriority);

  const ordered: Stop[] = [];
  let currentPos = startCoords;

  // Process priority stops first with nearest neighbor
  const remainingPriority = [...priorityStops];
  while (remainingPriority.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remainingPriority.length; i++) {
      const dist = calculateRoadDistanceKm(currentPos, {
        lat: remainingPriority[i].lat,
        lng: remainingPriority[i].lng,
      });
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const nextStop = remainingPriority.splice(nearestIdx, 1)[0];
    ordered.push(nextStop);
    currentPos = { lat: nextStop.lat, lng: nextStop.lng };
  }

  // Process normal stops with nearest neighbor
  const remainingNormal = [...normalStops];
  while (remainingNormal.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remainingNormal.length; i++) {
      const dist = calculateRoadDistanceKm(currentPos, {
        lat: remainingNormal[i].lat,
        lng: remainingNormal[i].lng,
      });
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const nextStop = remainingNormal.splice(nearestIdx, 1)[0];
    ordered.push(nextStop);
    currentPos = { lat: nextStop.lat, lng: nextStop.lng };
  }

  // Update sequence index
  const finalizedStops = ordered.map((stop, idx) => ({
    ...stop,
    sequenceIndex: idx + 1,
  }));

  // Calculate Productive vs Unproductive KM
  // 1. Unproductive Leg 1: CD Base -> Stop 1
  const legBaseToFirst = calculateRoadDistanceKm(startCoords, {
    lat: finalizedStops[0].lat,
    lng: finalizedStops[0].lng,
  });

  // 2. Productive Leg: Stop 1 -> Stop 2 -> ... -> Stop N
  let productiveKm = 0;
  for (let i = 0; i < finalizedStops.length - 1; i++) {
    productiveKm += calculateRoadDistanceKm(
      { lat: finalizedStops[i].lat, lng: finalizedStops[i].lng },
      { lat: finalizedStops[i + 1].lat, lng: finalizedStops[i + 1].lng }
    );
  }

  // 3. Unproductive Leg 2: Stop N -> Driver's Residence
  const legLastToHome = calculateRoadDistanceKm(
    {
      lat: finalizedStops[finalizedStops.length - 1].lat,
      lng: finalizedStops[finalizedStops.length - 1].lng,
    },
    endCoords
  );

  const unproductiveKm = Number((legBaseToFirst + legLastToHome).toFixed(1));
  productiveKm = Number(productiveKm.toFixed(1));
  const totalKm = Number((productiveKm + unproductiveKm).toFixed(1));

  const validAvgKmLiter = avgKmLiter > 0 ? avgKmLiter : 8.5;
  const estimatedFuelCost = Number(((totalKm / validAvgKmLiter) * fuelPrice).toFixed(2));
  const costPerKm = totalKm > 0 ? Number((estimatedFuelCost / totalKm).toFixed(2)) : 0;

  return {
    orderedStops: finalizedStops,
    productiveKm,
    unproductiveKm,
    totalKm,
    estimatedFuelCost,
    costPerKm,
  };
}
