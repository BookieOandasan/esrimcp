import { Injectable } from '@angular/core';
import { GeocodeResult } from '../models/app.types';

const WORLD_GEOCODER_URL =
  'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  async geocode(query: string): Promise<GeocodeResult> {
    const { addressToLocations } = await import('@arcgis/core/rest/locator.js');

    const results = await addressToLocations(WORLD_GEOCODER_URL, {
      address: { SingleLine: query },
      maxLocations: 1,
      outFields: ['*'],
    });

    if (!results || results.length === 0) {
      throw new Error(`No results found for "${query}"`);
    }

    const top = results[0];
    const loc = top.location;
    if (!loc) throw new Error(`Geocoder returned a result without coordinates for "${query}"`);

    return {
      displayName: top.address ?? query,
      longitude: loc.longitude as number,
      latitude: loc.latitude as number,
      score: top.score ?? 0,
      extent: top.extent
        ? {
            xmin: top.extent.xmin ?? 0,
            ymin: top.extent.ymin ?? 0,
            xmax: top.extent.xmax ?? 0,
            ymax: top.extent.ymax ?? 0,
            spatialReference: { wkid: (top.extent.spatialReference?.wkid ?? 4326) as number },
          }
        : undefined,
    };
  }
}
