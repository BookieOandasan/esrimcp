import type { GeocodeResult } from '../../src/app/core/models/app.types';

export const GEOCODE_SUCCESS_RESPONSE: GeocodeResult = {
  displayName: 'Seattle, WA, USA',
  longitude: -122.3321,
  latitude: 47.6062,
  score: 100,
  extent: {
    xmin: -122.459696,
    ymin: 47.495559,
    xmax: -122.224433,
    ymax: 47.734145,
    spatialReference: { wkid: 4326 },
  },
};

export const GEOCODE_NO_MATCH_RESPONSE = {
  error: 'NO_MATCH',
  message: 'No location found for query: "xyzzy123"',
};

export const GEOCODE_AUTH_FAILURE_RESPONSE = {
  error: 'AUTH_FAILURE',
  message: 'Invalid API key.',
};
