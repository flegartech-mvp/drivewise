/** Pre-defined GPS route segments for demo areas in Slovenia */

export interface RouteWaypoint {
  lat: number;
  lng: number;
  speedLimitKmh: number;
  roadType: string;
}

export const ROUTES: Record<string, RouteWaypoint[]> = {
  murskaSobota_city: [
    { lat: 46.6632, lng: 16.1663, speedLimitKmh: 50, roadType: 'residential' },
    { lat: 46.6641, lng: 16.1680, speedLimitKmh: 50, roadType: 'residential' },
    { lat: 46.6655, lng: 16.1701, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.6672, lng: 16.1720, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.6688, lng: 16.1745, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.6700, lng: 16.1770, speedLimitKmh: 50, roadType: 'residential' },
    { lat: 46.6715, lng: 16.1790, speedLimitKmh: 50, roadType: 'residential' },
  ],
  murskaSobota_highway: [
    { lat: 46.6500, lng: 16.1200, speedLimitKmh: 130, roadType: 'motorway' },
    { lat: 46.6550, lng: 16.1320, speedLimitKmh: 130, roadType: 'motorway' },
    { lat: 46.6600, lng: 16.1440, speedLimitKmh: 130, roadType: 'motorway' },
    { lat: 46.6640, lng: 16.1560, speedLimitKmh: 130, roadType: 'motorway' },
    { lat: 46.6660, lng: 16.1600, speedLimitKmh: 90, roadType: 'trunk' },
    { lat: 46.6672, lng: 16.1630, speedLimitKmh: 50, roadType: 'primary' },
  ],
  ljubljana_city: [
    { lat: 46.0569, lng: 14.5058, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.0580, lng: 14.5080, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.0592, lng: 14.5100, speedLimitKmh: 50, roadType: 'secondary' },
    { lat: 46.0605, lng: 14.5115, speedLimitKmh: 50, roadType: 'secondary' },
    { lat: 46.0618, lng: 14.5130, speedLimitKmh: 30, roadType: 'residential' },
    { lat: 46.0630, lng: 14.5145, speedLimitKmh: 30, roadType: 'residential' },
    { lat: 46.0640, lng: 14.5165, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.0650, lng: 14.5185, speedLimitKmh: 50, roadType: 'primary' },
  ],
  maribor_city: [
    { lat: 46.5547, lng: 15.6459, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.5558, lng: 15.6480, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.5570, lng: 15.6500, speedLimitKmh: 50, roadType: 'secondary' },
    { lat: 46.5580, lng: 15.6520, speedLimitKmh: 50, roadType: 'secondary' },
    { lat: 46.5590, lng: 15.6540, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.5600, lng: 15.6560, speedLimitKmh: 50, roadType: 'primary' },
  ],
  celje_city: [
    { lat: 46.2312, lng: 15.2677, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.2320, lng: 15.2695, speedLimitKmh: 50, roadType: 'primary' },
    { lat: 46.2332, lng: 15.2710, speedLimitKmh: 50, roadType: 'secondary' },
    { lat: 46.2345, lng: 15.2725, speedLimitKmh: 30, roadType: 'residential' },
    { lat: 46.2355, lng: 15.2738, speedLimitKmh: 30, roadType: 'residential' },
    { lat: 46.2365, lng: 15.2750, speedLimitKmh: 50, roadType: 'primary' },
  ],
};

export type RouteKey = keyof typeof ROUTES;
