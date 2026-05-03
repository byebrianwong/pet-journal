// Stub expo-image-picker for Vite/web stories.
export const MediaTypeOptions = { Images: 'Images', Videos: 'Videos', All: 'All' } as const;
export const MediaType = { image: 'image', video: 'video' } as const;

export async function requestMediaLibraryPermissionsAsync() {
  return { status: 'granted' as const, granted: true };
}
export async function launchImageLibraryAsync(_opts?: any) {
  return { canceled: true, assets: null } as any;
}
export async function launchCameraAsync(_opts?: any) {
  return { canceled: true, assets: null } as any;
}

export default {};
