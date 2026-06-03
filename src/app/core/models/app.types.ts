export type MapStatus = 'uninitialized' | 'loading' | 'ready' | 'error';
export type SessionStatus = 'uninitialized' | 'connecting' | 'active' | 'error' | 'closed';
export type OperationStatus = 'pending' | 'success' | 'error';
export type McpToolName = 'geocode_location';

export interface MapExtent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference: { wkid: number };
}

export interface GeocodeResult {
  displayName: string;
  longitude: number;
  latitude: number;
  score: number;
  extent?: MapExtent;
}

export interface GeocodeLocationInput {
  query: string;
}

export interface McpToolLog {
  timestamp: string;
  tool: McpToolName;
  params: Record<string, unknown>;
  responseStatus: 'success' | 'error';
  durationMs: number;
  error?: string;
}
