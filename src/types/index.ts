export type UserRole = 'motorista' | 'gestor';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface CompanyBase {
  id: string;
  name: string; // ex: "CD Central Campinas", "Matriz", "Filial"
  address: string;
  coords: LatLng;
  isDefault?: boolean;
  createdAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  vehiclePlate?: string;
  photoURL?: string;
  homeAddress?: string;
  homeCoords?: LatLng;
  accessPassword?: string;
  createdAt?: string;
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

export type RouteStatus = 'planejada' | 'em_andamento' | 'concluida' | 'cancelada' | 'aguardando_exclusao';

export type MaintenanceType =
  | 'troca_oleo'
  | 'troca_pneu'
  | 'alinhamento_balanceamento'
  | 'freios'
  | 'filtros'
  | 'revisao_geral'
  | 'suspensao'
  | 'bateria'
  | 'outro';

export interface MaintenanceRecord {
  id: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  type: MaintenanceType;
  customTypeLabel?: string;
  cost: number; // R$
  kmAtMaintenance: number;
  date: string; // YYYY-MM-DD
  workshopName?: string;
  notes?: string;
  createdAt: string;
}

export type DeletionRequestStatus = 'pendente' | 'aprovada' | 'rejeitada';

export interface ClosureDeletionRequest {
  id: string;
  routeId: string;
  date: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  totalKm: number;
  deliveredValue: number;
  reason: string;
  status: DeletionRequestStatus;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  managerNotes?: string;
}

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
  orderNumber?: string; // Pedido ou Nota Fiscal
  hasSignature?: boolean; // Se foi detectada assinatura física no romaneio de papel
  alreadyDelivered?: boolean; // Se foi dado como entregue em fechamento prévio
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
  manifestImages?: string[]; // Scanned manifest photos/pages
  odometerStartHome?: number; // Km ao sair de casa pela manhã
  odometerStartCompany?: number; // Km ao chegar na empresa / sair para entregas
  odometerEndCompany?: number; // Km ao retornar para empresa / finalizar entregas
  odometerEndHome?: number; // Km ao chegar de volta em casa
  odometerCalculated?: boolean; // Flag if KM was calibrated via real odometer
  parentRouteId?: string; // Se continuou de um romaneio anterior
  deletionRequestId?: string;
  deletionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressSuggestion {
  displayName: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  placeId?: string;
  source?: 'google' | 'osm' | 'local';
}

export interface ManifestItemDraft {
  id: string;
  orderNumber?: string;
  clientName: string;
  address: string;
  city?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  orderValue: number;
  totalWeight: number;
  isPriority: boolean;
  paymentMethod: PaymentMethod;
  notes?: string;
  hasSignature?: boolean;
  alreadyDelivered?: boolean;
  signatureNotes?: string;
}

export type TimeFilter = 'dia' | 'semana' | 'mes' | 'ano';
