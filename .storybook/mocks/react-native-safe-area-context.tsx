// Browser stub for react-native-safe-area-context. Provides API-compatible
// shims so screens can use SafeAreaView/SafeAreaProvider without pulling in
// the package's native specs (which import Flow-typed react-native source).
import React from 'react';
import { View, type ViewProps } from 'react-native';

const defaultInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const defaultFrame = { x: 0, y: 0, width: 0, height: 0 };

export function SafeAreaProvider({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: any;
  initialMetrics?: any;
}) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}

export function SafeAreaView({ children, style, edges: _edges, ...rest }: ViewProps & { edges?: string[] }) {
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
}

export function useSafeAreaInsets() {
  return defaultInsets;
}

export function useSafeAreaFrame() {
  return defaultFrame;
}

export const SafeAreaInsetsContext = React.createContext(defaultInsets);
export const SafeAreaFrameContext = React.createContext(defaultFrame);

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
  useSafeAreaFrame,
};
