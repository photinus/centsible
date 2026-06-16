import { useWindowDimensions } from 'react-native';
import { Breakpoints } from '../constants/theme';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= Breakpoints.tablet;
  const isDesktop = width >= Breakpoints.desktop;
  const isLandscape = width > height;

  return { width, height, isTablet, isDesktop, isLandscape };
}
