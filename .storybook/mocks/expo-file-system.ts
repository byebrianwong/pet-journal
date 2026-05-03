// Stub expo-file-system for Vite/web stories.
export const documentDirectory = '/';
export const cacheDirectory = '/cache/';
export const EncodingType = { Base64: 'base64', UTF8: 'utf8' } as const;

export async function readAsStringAsync(_uri: string, _opts?: any): Promise<string> { return ''; }
export async function writeAsStringAsync(_uri: string, _data: string, _opts?: any): Promise<void> {}
export async function getInfoAsync(_uri: string) { return { exists: false } as any; }
export async function deleteAsync(_uri: string, _opts?: any): Promise<void> {}

export default {};
