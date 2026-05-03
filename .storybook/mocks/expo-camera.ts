// Stub expo-camera for Vite/web stories.
import React from 'react';

export const Camera = (_props: any) => null as React.ReactNode;
export const CameraType = { back: 'back', front: 'front' } as const;
export async function requestCameraPermissionsAsync() { return { status: 'granted' as const, granted: true }; }
export async function getCameraPermissionsAsync() { return { status: 'granted' as const, granted: true }; }

export default {};
