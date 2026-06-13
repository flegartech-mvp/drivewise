import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

interface OpenWeatherResponse {
  main?: { temp?: number };
  wind?: { speed?: number };
  visibility?: number;
  weather?: { main?: string; description?: string }[];
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getCurrentWeather(lat: number, lng: number) {
    const apiKey = this.config.get<string>('OPENWEATHER_API_KEY', '');
    if (!apiKey) {
      return this.mockWeather(lat, lng);
    }

    try {
      const res = await axios.get<OpenWeatherResponse>(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`,
        { timeout: 8000 },
      );
      const d = res.data;
      const snapshot = {
        source: 'OPENWEATHER',
        latitude: lat,
        longitude: lng,
        temperature: d.main?.temp,
        rain: d.rain?.['1h'],
        snow: d.snow?.['1h'],
        windSpeed: d.wind?.speed,
        visibility: d.visibility ? d.visibility / 1000 : undefined,
        condition: d.weather?.[0]?.main,
        timestamp: new Date(),
        rawPayload: JSON.stringify(d),
      };
      await this.prisma.weatherSnapshot.create({ data: snapshot });
      return snapshot;
    } catch (err) {
      this.logger.warn(`Weather fetch failed: ${err instanceof Error ? err.message : err}`);
      return this.mockWeather(lat, lng);
    }
  }

  private mockWeather(lat: number, lng: number) {
    return {
      source: 'MOCK',
      latitude: lat,
      longitude: lng,
      temperature: 18,
      rain: 0,
      snow: 0,
      windSpeed: 5,
      visibility: 10,
      condition: 'Clear',
      timestamp: new Date(),
      rawPayload: '{}',
    };
  }
}
