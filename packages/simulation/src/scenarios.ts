import type { SensorSample } from '@drivewise/shared';
import { RouteWaypoint, ROUTES, RouteKey } from './routes';

export type ScenarioId =
  | 'safe_city'
  | 'safe_highway'
  | 'aggressive_driver'
  | 'harsh_braking'
  | 'harsh_acceleration'
  | 'sharp_cornering'
  | 'phone_movement'
  | 'speeding'
  | 'stop_and_go'
  | 'night_drive'
  | 'rain_context'
  | 'gps_signal_loss'
  | 'sensor_noise'
  | 'full_risk';

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  labelSl: string;
  description: string;
  routeKey: RouteKey;
  durationSeconds: number;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'safe_city',
    label: 'Safe city drive',
    labelSl: 'Varna mestna vožnja',
    description: 'Smooth, law-abiding drive through city streets.',
    routeKey: 'murskaSobota_city',
    durationSeconds: 600,
  },
  {
    id: 'safe_highway',
    label: 'Safe highway drive',
    labelSl: 'Varna vožnja po avtocesti',
    description: 'Clean motorway drive at legal speed.',
    routeKey: 'murskaSobota_highway',
    durationSeconds: 480,
  },
  {
    id: 'aggressive_driver',
    label: 'Aggressive driver',
    labelSl: 'Agresivni voznik',
    description: 'Speeding, harsh braking, and sharp cornering.',
    routeKey: 'maribor_city',
    durationSeconds: 480,
  },
  {
    id: 'harsh_braking',
    label: 'Harsh braking event',
    labelSl: 'Močno zaviranje',
    description: 'Multiple harsh braking events.',
    routeKey: 'celje_city',
    durationSeconds: 300,
  },
  {
    id: 'harsh_acceleration',
    label: 'Harsh acceleration',
    labelSl: 'Močno pospeševanje',
    description: 'Aggressive acceleration from stops.',
    routeKey: 'celje_city',
    durationSeconds: 300,
  },
  {
    id: 'sharp_cornering',
    label: 'Sharp cornering',
    labelSl: 'Ostri ovinki',
    description: 'Sharp turns at higher-than-safe speed.',
    routeKey: 'maribor_city',
    durationSeconds: 360,
  },
  {
    id: 'phone_movement',
    label: 'Phone movement during driving',
    labelSl: 'Možen premik telefona',
    description: 'Simulated phone handling events while driving.',
    routeKey: 'ljubljana_city',
    durationSeconds: 400,
  },
  {
    id: 'speeding',
    label: 'Speeding on road segment',
    labelSl: 'Prekoračitev hitrosti',
    description: 'Driving over speed limit on city and highway segments.',
    routeKey: 'murskaSobota_highway',
    durationSeconds: 360,
  },
  {
    id: 'stop_and_go',
    label: 'Stop-and-go traffic',
    labelSl: 'Ustavljanje in speljevanje',
    description: 'Dense urban traffic with frequent stops.',
    routeKey: 'ljubljana_city',
    durationSeconds: 720,
  },
  {
    id: 'night_drive',
    label: 'Night drive',
    labelSl: 'Nočna vožnja',
    description: 'Driving during night hours.',
    routeKey: 'murskaSobota_city',
    durationSeconds: 480,
  },
  {
    id: 'rain_context',
    label: 'Rain / fog risk context',
    labelSl: 'Dež / megla',
    description: 'Driving with adverse weather context.',
    routeKey: 'maribor_city',
    durationSeconds: 480,
  },
  {
    id: 'gps_signal_loss',
    label: 'GPS signal loss',
    labelSl: 'Izguba GPS signala',
    description: 'Trip with intermittent GPS coverage.',
    routeKey: 'celje_city',
    durationSeconds: 360,
  },
  {
    id: 'sensor_noise',
    label: 'Sensor noise simulation',
    labelSl: 'Šum senzorjev',
    description: 'Noisy accelerometer and GPS accuracy.',
    routeKey: 'murskaSobota_city',
    durationSeconds: 300,
  },
  {
    id: 'full_risk',
    label: 'Full risky drive',
    labelSl: 'Popolna tvegana vožnja',
    description: 'All event types in one trip.',
    routeKey: 'maribor_city',
    durationSeconds: 720,
  },
];
