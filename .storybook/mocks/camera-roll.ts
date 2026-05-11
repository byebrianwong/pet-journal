/**
 * Storybook mock for camera-roll. Returns empty by default; stories that
 * want to test the photo-cluster suggestion path can configure mock data
 * via parameters.mock.photoClusters and the suggestions engine will pick
 * it up directly (we don't currently read from this mock in stories).
 */
export interface CameraRollAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
  location: { lat: number; lng: number } | null;
}

export interface PhotoCluster {
  id: string;
  assets: CameraRollAsset[];
  label: string;
  centroidTime: number;
  centroidLocation: { lat: number; lng: number } | null;
}

export async function ensurePermission(): Promise<boolean> { return false; }
export async function getRecentPhotos(_limit?: number): Promise<CameraRollAsset[]> { return []; }
export function clusterPhotos(_assets: CameraRollAsset[]): PhotoCluster[] { return []; }
