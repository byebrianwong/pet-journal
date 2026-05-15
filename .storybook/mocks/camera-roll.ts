/**
 * Storybook mock for camera-roll.
 *
 * TimelineScreen calls getRecentPhotos() then feeds the result to
 * clusterPhotos(). Real expo-media-library doesn't load on web, so to
 * exercise the photo_cluster suggestion path from a story we short-circuit
 * clusterPhotos() to return whatever MockState.photoClusters contains —
 * ignoring its input. Stories drive the data via:
 *   parameters: { mock: { photoClusters: [fixturePhotoCluster] } }
 */
import { getMockState } from './state';

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
export function clusterPhotos(_assets: CameraRollAsset[]): PhotoCluster[] {
  return getMockState().photoClusters;
}
