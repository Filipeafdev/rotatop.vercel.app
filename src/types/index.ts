export type UserRole = 'motorista' | 'gestor';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  vehiclePlate?: string;
  photoURL?: string;
}

export type FuelType = 'diesel' | 'gasolina' | 'etanol' | 'gnv' | 'eletrico';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  avgKmLiter: number;
  fuelType: FuelType;
  status: 'ativo' | 'manutencao' | 'inativo';
  assignedDriverName?: string;
  assignedDriverId?: string;
}

export type RouteStatus = 'planejada' | 'em_andamento' | 'concluida' | 'cancelada';

export type StopStatus = 'pendente' | 'entregue' | 'cancelada' | 'reentregar';

export type PaymentMethod = 'a_vista' | 'a_prazo';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  routeId: string;
  sequenceIndex: number;
  clientName: string;
  address: string;
  lat: number;
  lng: number;
  orderValue: number;
  totalWeight: number; // in kg
  isPriority: boolean; // "Primeira Entrega"
  paymentMethod: PaymentMethod;
  notes?: string;
  status: StopStatus;
  cancelReason?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface Route {
  id: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  date: string;
  status: RouteStatus;
  startAddress: string;
  startCoords: LatLng;
  endAddress: string;
  endCoords: LatLng;
  productiveKm: number;
  unproductiveKm: number;
  totalKm: number;
  avgKmLiter: number;
  fuelPrice: number; // R$/L
  estimatedFuelCost: number; // (TotalKm / avgKmLiter) * fuelPrice
  totalWeight: number;
  totalValue: number;
  deliveredWeight: number;
  deliveredValue: number;
  stops: Stop[];
  createdAt: string;
  updatedAt: string;
}

export interface AddressSuggestion {
  displayName: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export interface ManifestItemDraft {
  id: string;
  clientName: string;
  address: string;
  lat?: number;
  lng?: number;
  orderValue: number;
  totalWeight: number;
  isPriority: boolean;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export type TimeFilter = 'dia' | 'semana' | 'mes' | 'ano';
