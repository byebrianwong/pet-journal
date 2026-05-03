// Stub expo-linking for Vite/web stories.
export function createURL(path: string): string {
  return `petjournal://${path.replace(/^\//, '')}`;
}
export async function openURL(_url: string): Promise<void> {}
export async function getInitialURL(): Promise<string | null> { return null; }
export function addEventListener(_type: string, _h: any) { return { remove: () => {} }; }

export default {};
