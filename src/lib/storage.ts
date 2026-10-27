import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
  Route,
  Stop,
  UserProfile,
  Vehicle,
  MaintenanceRecord,
  ClosureDeletionRequest,
  CompanyBase,
} from '../types';

// Migration flag to ensure team setup is cleanly initialized
const STORAGE_CLEAN_VERSION_KEY = 'rotatop_team_pilot_v4';
if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_CLEAN_VERSION_KEY)) {
  // Clear old storage keys to initialize the 3-user team cleanly
  localStorage.removeItem('rotatop_vehicles_v2');
  localStorage.removeItem('rotatop_active_route_v2');
  localStorage.removeItem('rotatop_history_routes_v2');
  localStorage.removeItem('rotatop_user_profile_v2');
  localStorage.removeItem('rotatop_maintenances_v2');
  localStorage.removeItem('rotatop_deletion_requests_v2');
  localStorage.removeItem('rotatop_drivers_v2');
  localStorage.setItem(STORAGE_CLEAN_VERSION_KEY, 'true');
}

// Initial Clean State
export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_COMPANY_BASES: CompanyBase[] = [];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'gestor-guilherme',
    email: 'guilherme@rotatop.com.br',
    displayName: 'Guilherme (Gestor / Dono da Frota)',
    role: 'gestor',
    phone: '',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'gestor-filipe',
    email: 'filipeafdev@gmail.com',
    displayName: 'Filipe (Adm Master)',
    role: 'gestor',
    phone: '',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_DRIVERS: UserProfile[] = [
  {
    uid: 'driver-filipe',
    email: 'filipeafdev@gmail.com',
    displayName: 'Filipe (Motorista)',
    role: 'motorista',
    accessPassword: 'Rota@1234',
    phone: '',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'driver-fabio',
    email: 'fabio@rotatop.com.br',
    displayName: 'Fábio (Motorista)',
    role: 'motorista',
    accessPassword: 'Rota@2026',
    phone: '',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_STOPS: Stop[] = [];

export const INITIAL_MAINTENANCES: MaintenanceRecord[] = [];

export const INITIAL_ROUTE: Route = {
  id: 'route-active',
  driverId: '',
  driverName: '',
  vehiclePlate: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'planejada',
  startAddress: '',
  startCoords: { lat: -22.9056, lng: -47.0608 },
  endAddress: '',
  endCoords: { lat: -22.9056, lng: -47.0608 },
  productiveKm: 0,
  unproductiveKm: 0,
  totalKm: 0,
  avgKmLiter: 9.0,
  fuelPrice: 6.19,
  estimatedFuelCost: 0,
  totalWeight: 0,
  totalValue: 0,
  deliveredWeight: 0,
  deliveredValue: 0,
  stops: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Storage Keys
const KEY_VEHICLES = 'rotatop_vehicles_v2';
const KEY_ACTIVE_ROUTE = 'rotatop_active_route_v2';
const KEY_HISTORICAL_ROUTES = 'rotatop_history_routes_v2';
const KEY_CURRENT_USER = 'rotatop_user_profile_v2';
const KEY_DRIVERS = 'rotatop_drivers_v2';
const KEY_COMPANY_BASES = 'rotatop_company_bases_v2';
const KEY_MAINTENANCES = 'rotatop_maintenances_v2';
const KEY_DELETION_REQUESTS = 'rotatop_deletion_requests_v2';

export const storage = {
  // 1. Company Bases (CD / Galpão / Matriz)
  getCompanyBases(): CompanyBase[] {
    const raw = localStorage.getItem(KEY_COMPANY_BASES);
    if (!raw) {
      return INITIAL_COMPANY_BASES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCompanyBases(bases: CompanyBase[]) {
    localStorage.setItem(KEY_COMPANY_BASES, JSON.stringify(bases));
    bases.forEach(async (b) => {
      try {
        await setDoc(doc(db, 'company_bases', b.id), b, { merge: true });
      } catch (e) {
        // quiet fallback
      }
    });
  },

  addCompanyBase(base: CompanyBase): CompanyBase[] {
    const bases = this.getCompanyBases();
    // If marked default, unmark others
    const updated = base.isDefault
      ? [base, ...bases.map((b) => ({ ...b, isDefault: false }))]
      : [base, ...bases];
    this.saveCompanyBases(updated);
    return updated;
  },

  // 2. Drivers
  getDrivers(): UserProfile[] {
    const raw = localStorage.getItem(KEY_DRIVERS);
    if (!raw) {
      localStorage.setItem(KEY_DRIVERS, JSON.stringify(INITIAL_DRIVERS));
      return INITIAL_DRIVERS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      localStorage.setItem(KEY_DRIVERS, JSON.stringify(INITIAL_DRIVERS));
      return INITIAL_DRIVERS;
    } catch {
      return INITIAL_DRIVERS;
    }
  },

  saveDrivers(drivers: UserProfile[]) {
    localStorage.setItem(KEY_DRIVERS, JSON.stringify(drivers));
    drivers.forEach(async (d) => {
      try {
        await setDoc(doc(db, 'users', d.uid), d, { merge: true });
      } catch (e) {
        // quiet fallback
      }
    });
  },

  saveDriver(driver: UserProfile): UserProfile[] {
    const drivers = this.getDrivers();
    const existingIndex = drivers.findIndex((d) => d.uid === driver.uid);
    let updated: UserProfile[];
    if (existingIndex >= 0) {
      updated = [...drivers];
      updated[existingIndex] = driver;
    } else {
      updated = [...drivers, driver];
    }
    this.saveDrivers(updated);
    return updated;
  },

  // 3. Vehicles
  getVehicles(): Vehicle[] {
    const raw = localStorage.getItem(KEY_VEHICLES);
    if (!raw) {
      return INITIAL_VEHICLES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveVehicles(vehicles: Vehicle[]) {
    localStorage.setItem(KEY_VEHICLES, JSON.stringify(vehicles));
    vehicles.forEach(async (v) => {
      try {
        await setDoc(doc(db, 'vehicles', v.id), v, { merge: true });
      } catch (e) {
        // quiet fallback
      }
    });
  },

  // 4. Active Route
  getActiveRoute(): Route {
    const raw = localStorage.getItem(KEY_ACTIVE_ROUTE);
    if (!raw) {
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
    try {
      setDoc(doc(db, 'routes', route.id), route, { merge: true });
    } catch (e) {
      // quiet fallback
    }
  },

  clearActiveRoute(): Route {
    const bases = this.getCompanyBases();
    const defaultBase = bases.find((b) => b.isDefault) || bases[0];
    const currentUser = this.getCurrentUser();

    const emptyRoute: Route = {
      id: `route-${Date.now()}`,
      driverId: currentUser.uid || '',
      driverName: currentUser.displayName || '',
      vehiclePlate: currentUser.vehiclePlate || '',
      date: new Date().toISOString().slice(0, 10),
      status: 'planejada',
      startAddress: defaultBase ? defaultBase.address : '',
      startCoords: defaultBase ? defaultBase.coords : { lat: -22.9056, lng: -47.0608 },
      endAddress: currentUser.homeAddress || '',
      endCoords: currentUser.homeCoords || (defaultBase ? defaultBase.coords : { lat: -22.9056, lng: -47.0608 }),
      productiveKm: 0,
      unproductiveKm: 0,
      totalKm: 0,
      avgKmLiter: 9.0,
      fuelPrice: 6.19,
      estimatedFuelCost: 0,
      totalWeight: 0,
      totalValue: 0,
      deliveredWeight: 0,
      deliveredValue: 0,
      stops: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY_ACTIVE_ROUTE, JSON.stringify(emptyRoute));
    try {
      setDoc(doc(db, 'routes', emptyRoute.id), emptyRoute, { merge: true });
    } catch (e) {
      // quiet fallback
    }
    return emptyRoute;
  },

  // 5. Historical Routes
  getHistoricalRoutes(): Route[] {
    const raw = localStorage.getItem(KEY_HISTORICAL_ROUTES);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveHistoricalRoutes(routes: Route[]) {
    localStorage.setItem(KEY_HISTORICAL_ROUTES, JSON.stringify(routes));
    routes.forEach(async (r) => {
      try {
        await setDoc(doc(db, 'routes', r.id), r, { merge: true });
      } catch (e) {
        // quiet fallback
      }
    });
  },

  // 6. Current User
  getCurrentUser(): UserProfile {
    const raw = localStorage.getItem(KEY_CURRENT_USER);
    if (!raw) {
      localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(INITIAL_USERS[1]));
      return INITIAL_USERS[1];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS[1];
    }
  },

  saveCurrentUser(user: UserProfile) {
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(user));
  },

  // 7. Maintenance Records
  getMaintenanceRecords(): MaintenanceRecord[] {
    const raw = localStorage.getItem(KEY_MAINTENANCES);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveMaintenanceRecords(records: MaintenanceRecord[]) {
    localStorage.setItem(KEY_MAINTENANCES, JSON.stringify(records));
    records.forEach(async (rec) => {
      try {
        await setDoc(doc(db, 'maintenance', rec.id), rec, { merge: true });
      } catch (e) {
        // quiet fallback
      }
    });
  },

  addMaintenanceRecord(record: MaintenanceRecord): MaintenanceRecord[] {
    const records = this.getMaintenanceRecords();
    const updated = [record, ...records];
    this.saveMaintenanceRecords(updated);
    return updated;
  },

  // 8. Deletion Requests
  getDeletionRequests(): ClosureDeletionRequest[] {
    const raw = localStorage.getItem(KEY_DELETION_REQUESTS);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveDeletionRequests(requests: ClosureDeletionRequest[]) {
    localStorage.setItem(KEY_DELETION_REQUESTS, JSON.stringify(requests));
    requests.forEach(async (req) => {
      try {
        await setDoc(doc(db, 'closure_deletion_requests', req.id), req, { merge: true });
      } catch (e) {
        // quiet fallback
      }
    });
  },
};
