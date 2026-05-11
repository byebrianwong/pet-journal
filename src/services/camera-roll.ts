/**
 * Camera-roll inspection for the Smart Feed.
 *
 * Goal: find recent photos that look like they belong in a Pet Journal
 * memory — photos taken in the last 24h, grouped by location/time so a
 * "4 photos from Lake Park" suggestion can fire on the home feed.
 *
 * Native-only. expo-media-library doesn't have a meaningful web shim, so
 * on web this module returns an empty list and the suggestion engine
 * gracefully skips the photo path.
 *
 * Permissions: we ask for read-only library access (PHPhotoLibrary
 * .requestAuthorization on iOS). We never write or delete photos. The
 * URIs we read are local — they never leave the device unless the user
 * explicitly creates a memory entry with that photo.
 */
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export interface CameraRollAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;          // ms since epoch
  location: { lat: number; lng: number } | null;
}

export interface PhotoCluster {
  /** Stable identifier so the suggestion key persists between refreshes. */
  id: string;
  assets: CameraRollAsset[];
  /** Best-guess label — "Lake Park" if we can reverse-geocode, otherwise
   *  "3 photos from this afternoon". */
  label: string;
  /** Median creation time, in ms. */
  centroidTime: number;
  /** Median lat/lng if we have it, otherwise null. */
  centroidLocation: { lat: number; lng: number } | null;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const RECENT_WINDOW_MS = 24 * ONE_HOUR_MS;
const CLUSTER_GAP_MS = 2 * ONE_HOUR_MS;   // photos within this gap = same outing
const CLUSTER_DISTANCE_M = 500;            // ...within this radius of each other

/**
 * Returns true if we have (or can get) photo-library read access.
 * Triggers the permission prompt on iOS if we haven't asked yet.
 */
export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await MediaLibrary.getPermissionsAsync();
  if (existing.status === 'granted' || existing.status === 'limited') return true;
  if (!existing.canAskAgain) return false;
  const req = await MediaLibrary.requestPermissionsAsync();
  return req.status === 'granted' || req.status === 'limited';
}

/**
 * Load up to `limit` photos taken in the last 24 hours. Empty array on
 * web or when permission is denied.
 */
export async function getRecentPhotos(limit = 50): Promise<CameraRollAsset[]> {
  if (Platform.OS === 'web') return [];
  const ok = await ensurePermission();
  if (!ok) return [];

  const result = await MediaLibrary.getAssetsAsync({
    mediaType: MediaLibrary.MediaType.photo,
    first: limit,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });

  const cutoff = Date.now() - RECENT_WINDOW_MS;
  const recent = result.assets.filter(a => a.creationTime >= cutoff);

  // Resolve location for each. getAssetInfoAsync is slower but the
  // only way to read EXIF GPS in expo-media-library.
  const enriched: CameraRollAsset[] = [];
  for (const a of recent) {
    let location: CameraRollAsset['location'] = null;
    try {
      const info = await MediaLibrary.getAssetInfoAsync(a.id);
      if (info.location) {
        location = { lat: info.location.latitude, lng: info.location.longitude };
      }
    } catch {
      // ignore individual asset failures — we'd rather suggest with no
      // location than not suggest at all
    }
    enriched.push({
      id: a.id,
      uri: a.uri,
      filename: a.filename,
      width: a.width,
      height: a.height,
      creationTime: a.creationTime,
      location,
    });
  }
  return enriched;
}

/**
 * Group recent photos into "outings" — clusters of photos taken close
 * together in time and (when available) location.
 */
export function clusterPhotos(assets: CameraRollAsset[]): PhotoCluster[] {
  if (assets.length === 0) return [];

  // Sort by time, newest first
  const sorted = [...assets].sort((a, b) => b.creationTime - a.creationTime);

  const clusters: CameraRollAsset[][] = [];
  for (const asset of sorted) {
    const fit = clusters.find(c => {
      const last = c[c.length - 1];
      if (Math.abs(last.creationTime - asset.creationTime) > CLUSTER_GAP_MS) return false;
      if (asset.location && last.location) {
        return distanceMeters(asset.location, last.location) <= CLUSTER_DISTANCE_M;
      }
      // Without location, fall back to time-only clustering.
      return true;
    });
    if (fit) {
      fit.push(asset);
    } else {
      clusters.push([asset]);
    }
  }

  return clusters
    .filter(c => c.length >= 1)
    .map((assets, i) => {
      const times = assets.map(a => a.creationTime).sort((a, b) => a - b);
      const centroidTime = times[Math.floor(times.length / 2)];
      const locs = assets.map(a => a.location).filter(Boolean) as { lat: number; lng: number }[];
      const centroidLocation = locs.length
        ? {
            lat: locs.reduce((s, l) => s + l.lat, 0) / locs.length,
            lng: locs.reduce((s, l) => s + l.lng, 0) / locs.length,
          }
        : null;
      return {
        id: `cluster-${i}-${centroidTime}`,
        assets,
        label: defaultLabel(assets.length, centroidTime),
        centroidTime,
        centroidLocation,
      };
    });
}

function defaultLabel(count: number, centroid: number): string {
  const ago = Date.now() - centroid;
  if (ago < 6 * ONE_HOUR_MS) return `${count} photo${count > 1 ? 's' : ''} from this afternoon`;
  if (ago < 12 * ONE_HOUR_MS) return `${count} photo${count > 1 ? 's' : ''} from earlier today`;
  return `${count} photo${count > 1 ? 's' : ''} from yesterday`;
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  // Haversine — good enough at the 500m scale we care about.
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
