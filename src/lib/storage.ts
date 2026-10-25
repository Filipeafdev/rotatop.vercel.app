import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Route, Stop, UserProfile, Vehicle } from '../types';

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    plate: 'BRA-2E19',
    model: 'Sprinter 314 CDI Furgão',
    brand: 'Mercedes-Benz',
    year: 2022,
    avgKmLiter: 9.2,
    fuelType: 'diesel',
    status: 'ativo',
    assignedDriverName: 'Carlos Silva (Você)',
    assignedDriverId: 'driver-carlos',
  },
  {
    id: 'veh-2',
    plate: 'RTO-8A45',
    model: 'Fiorino 1.4 EVO Flex',
    brand: 'Fiat',
    year: 2023,
    avgKmLiter: 11.5,
    fuelType: 'gasolina',
    status: 'ativo',
    assignedDriverName: 'Marcos Oliveira',
    assignedDriverId: 'driver-marcos',
  },
  {
    id: 'veh-3',
    plate: 'LOG-4F90',
    model: 'Delivery 9.170 V-Tronic',
    brand: 'Volkswagen',
    year: 2021,
    avgKmLiter: 6.8,
    fuelType: 'diesel',
    status: 'manutencao',
    assignedDriverName: 'Roberto Souza',
    assignedDriverId: 'driver-roberto',
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'driver-carlos',
    email: 'carlos.motorista@rotatop.com.br',
    displayName: 'Carlos Silva',
    role: 'motorista',
    phone: '(11) 98765-4321',
    vehiclePlate: 'BRA-2E19',
  },
  {
    uid: 'manager-mariana',
    email: 'mariana.gestor@rotatop.com.br',
    displayName: 'Mariana Souza',
    role: 'gestor',
    phone: '(11) 99123-8899',
  },
];

export const INITIAL_STOPS: Stop[] = [
  {
    id: 'stop-1',
    routeId: 'route-today-01',
    sequenceIndex: 1,
    clientName: 'Supermercado Central Pinheiros',
    address: 'Av. Brigadeiro Faria Lima, 2232, Pinheiros, São Paulo - SP',
    lat: -23.5762,
    lng: -46.6908,
    orderValue: 850.0,
    totalWeight: 140.0,
    isPriority: true,
    paymentMethod: 'a_vista',
    notes: 'Entregar na doca 2 até às 10h. Falar com Seu Antenor.',
    status: 'entregue',
    deliveredAt: '2026-10-25T08:35:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stop-2',
    routeId: 'route-today-01',
    sequenceIndex: 2,
    clientName: 'Drogaria Pacheco & Cia',
    address: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP',
    lat: -23.5654,
    lng: -46.6517,
    orderValue: 420.5,
    totalWeight: 45.0,
    isPriority: false,
    paymentMethod: 'a_prazo',
    notes: 'Caixas com medicamentos lacrados. Coletar assinatura no canhoto.',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stop-3',
    routeId: 'route-today-01',
    sequenceIndex: 3,
    clientName: 'Restaurante Sabor de Minas',
    address: 'R. Augusta, 1492, Consolação, São Paulo - SP',
    lat: -23.5559,
    lng: -46.6577,
    orderValue: 1280.0,
    totalWeight: 210.0,
    isPriority: false,
    paymentMethod: 'a_vista',
    notes: 'Recebimento nos fundos. Pagamento em PIX na conferência.',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stop-4',
    routeId: 'route-today-01',
    sequenceIndex: 4,
    clientName: 'Padaria Bella Paulista',
    address: 'R. Haddock Lobo, 354, Cerqueira César, São Paulo - SP',
    lat: -23.5582,
    lng: -46.6625,
    orderValue: 340.0,
    totalWeight: 60.0,
    isPriority: false,
    paymentMethod: 'a_prazo',
    notes: 'Farináceos e laticínios.',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stop-5',
    routeId: 'route-today-01',
    sequenceIndex: 5,
    clientName: 'Auto Peças Express',
    address: 'Av. do Estado, 5500, Cambuci, São Paulo - SP',
    lat: -23.5611,
    lng: -46.6198,
    orderValue: 690.0,
    totalWeight: 85.0,
    isPriority: false,
    paymentMethod: 'a_vista',
    notes: 'Bater no portão lateral de cargas.',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ROUTE: Route = {
  id: 'route-today-01',
  driverId: 'driver-carlos',
  driverName: 'Carlos Silva',
  vehiclePlate: 'BRA-2E19',
  date: '2026-10-25',
  status: 'em_andamento',
  startAddress: 'CD Central Distribuição - Rod. Anhanguera, km 18, São Paulo - SP',
  startCoords: { lat: -23.5042, lng: -46.7456 },
  endAddress: 'Residência do Motorista - R. Domingos de Morais, 1800, Vila Mariana, São Paulo - SP',
  endCoords: { lat: -23.5912, lng: -46.6384 },
  productiveKm: 18.4,
  unproductiveKm: 22.8,
  totalKm: 41.2,
  avgKmLiter: 9.2,
  fuelPrice: 6.29,
  estimatedFuelCost: 28.17,
  totalWeight: 540.0,
  totalValue: 3580.5,
  deliveredWeight: 140.0,
  deliveredValue: 850.0,
  stops: INITIAL_STOPS,
  createdAt: '2026-10-25T07:30:00',
  updatedAt: new Date().toISOString(),
};

// Local storage keys
const KEY_VEHICLES = 'rotatop_vehicles_v1';
const KEY_ACTIVE_ROUTE = 'rotatop_active_route_v1';
const KEY_HISTORICAL_ROUTES = 'rotatop_history_routes_v1';
const KEY_CURRENT_USER = 'rotatop_user_profile_v1';

export const storage = {
  getVehicles(): Vehicle[] {
    const raw = localStorage.getItem(KEY_VEHICLES);
    if (!raw) {
      localStorage.setItem(KEY_VEHICLES, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_VEHICLES;
    }
  },

  saveVehicles(vehicles: Vehicle[]) {
    localStorage.setItem(KEY_VEHICLES, JSON.stringify(vehicles));
    // Try firestore sync in background
    vehicles.forEach(async (v) => {
      try {
        await setDoc(doc(db, 'vehicles', v.id), v, { merge: true });
      } catch (e) {
        // quiet fallback
      }
    });
  },

  getActiveRoute(): Route {
    const raw = localStorage.getItem(KEY_ACTIVE_ROUTE);
    if (!raw) {
      localStorage.setItem(KEY_ACTIVE_ROUTE, JSON.stringify(INITIAL_ROUTE));
      return INITIAL_ROUTE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ROUTE;
    }
  },

  saveActiveRoute(route: Route) {
    localStorage.setItem(KEY_ACTIVE_ROUTE, JSON.stringify(route));
    // Try firestore sync in background
    try {
      setDoc(doc(db, 'routes', route.id), route, { merge: true });
    } catch (e) {
      // quiet fallback
    }
  },

  getHistoricalRoutes(): Route[] {
    const raw = localStorage.getItem(KEY_HISTORICAL_ROUTES);
    if (!raw) {
      // Create sample previous routes for realistic reports
      const samples: Route[] = [
        {
          id: 'route-prev-1',
          driverId: 'driver-carlos',
          driverName: 'Carlos Silva',
          vehiclePlate: 'BRA-2E19',
          date: '2026-10-24',
          status: 'concluida',
          startAddress: 'CD Central Distribuição - Rod. Anhanguera, km 18, São Paulo - SP',
          startCoords: { lat: -23.5042, lng: -46.7456 },
          endAddress: 'Residência do Motorista - R. Domingos de Morais, 1800, São Paulo - SP',
          endCoords: { lat: -23.5912, lng: -46.6384 },
          productiveKm: 34.2,
          unproductiveKm: 19.5,
          totalKm: 53.7,
          avgKmLiter: 9.2,
          fuelPrice: 6.29,
          estimatedFuelCost: 36.71,
          totalWeight: 680.0,
          totalValue: 4920.0,
          deliveredWeight: 680.0,
          deliveredValue: 4920.0,
          stops: [],
          createdAt: '2026-10-24T08:00:00',
          updatedAt: '2026-10-24T17:40:00',
        },
        {
          id: 'route-prev-2',
          driverId: 'driver-carlos',
          driverName: 'Carlos Silva',
          vehiclePlate: 'BRA-2E19',
          date: '2026-10-23',
          status: 'concluida',
          startAddress: 'CD Central Distribuição - Rod. Anhanguera, km 18, São Paulo - SP',
          startCoords: { lat: -23.5042, lng: -46.7456 },
          endAddress: 'Residência do Motorista - R. Domingos de Morais, 1800, São Paulo - SP',
          endCoords: { lat: -23.5912, lng: -46.6384 },
          productiveKm: 28.6,
          unproductiveKm: 21.0,
          totalKm: 49.6,
          avgKmLiter: 9.2,
          fuelPrice: 6.25,
          estimatedFuelCost: 33.69,
          totalWeight: 510.0,
          totalValue: 3840.0,
          deliveredWeight: 460.0,
          deliveredValue: 3450.0,
          stops: [],
          createdAt: '2026-10-23T08:00:00',
          updatedAt: '2026-10-23T16:50:00',
        },
        {
          id: 'route-prev-3',
          driverId: 'driver-marcos',
          driverName: 'Marcos Oliveira',
          vehiclePlate: 'RTO-8A45',
          date: '2026-10-24',
          status: 'concluida',
          startAddress: 'Galpão Logístico Rotatop - Av. Nações Unidas',
          startCoords: { lat: -23.6268, lng: -46.7029 },
          endAddress: 'Garagem Base',
          endCoords: { lat: -23.5855, lng: -46.6347 },
          productiveKm: 41.5,
          unproductiveKm: 14.8,
          totalKm: 56.3,
          avgKmLiter: 11.5,
          fuelPrice: 6.19,
          estimatedFuelCost: 30.3,
          totalWeight: 390.0,
          totalValue: 2950.0,
          deliveredWeight: 390.0,
          deliveredValue: 2950.0,
          stops: [],
          createdAt: '2026-10-24T08:30:00',
          updatedAt: '2026-10-24T18:10:00',
        },
      ];
      localStorage.setItem(KEY_HISTORICAL_ROUTES, JSON.stringify(samples));
      return samples;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getCurrentUser(): UserProfile {
    const raw = localStorage.getItem(KEY_CURRENT_USER);
    if (!raw) {
      localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
      return INITIAL_USERS[0];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS[0];
    }
  },

  saveCurrentUser(user: UserProfile) {
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
  },
};
