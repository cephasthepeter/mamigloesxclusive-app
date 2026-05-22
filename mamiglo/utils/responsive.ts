import React from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 6/7/8)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 667;

// Scale factors
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

// Responsive breakpoints
export const breakpoints = {
  xs: 320,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Screen size categories
export const screenSizes = {
  isSmall: SCREEN_WIDTH < breakpoints.sm,
  isMedium: SCREEN_WIDTH >= breakpoints.sm && SCREEN_WIDTH < breakpoints.md,
  isLarge: SCREEN_WIDTH >= breakpoints.md && SCREEN_WIDTH < breakpoints.lg,
  isExtraLarge: SCREEN_WIDTH >= breakpoints.lg,
};

// Responsive width function
export const rw = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * widthScale);
};

// Responsive height function
export const rh = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * heightScale);
};

// Responsive font size function
export const rf = (size: number): number => {
  const scale = Math.min(widthScale, heightScale);
  return PixelRatio.roundToNearestPixel(size * scale);
};

// Responsive spacing function
export const rs = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * Math.min(widthScale, heightScale));
};

// Get current screen orientation
export const getOrientation = (): 'portrait' | 'landscape' => {
  return SCREEN_HEIGHT > SCREEN_WIDTH ? 'portrait' : 'landscape';
};

// Hook for responsive values
export const useResponsive = () => {
  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isSmall = width < breakpoints.sm;
  const isMedium = width >= breakpoints.sm && width < breakpoints.md;
  const isLarge = width >= breakpoints.md && width < breakpoints.lg;
  const isExtraLarge = width >= breakpoints.lg;

  // Helper function to get image size based on screen category
  const getImageSize = (imageType: keyof typeof imageSizes) => {
    if (isSmall) return imageSizes[imageType].small;
    if (isMedium) return imageSizes[imageType].medium;
    if (isLarge) return imageSizes[imageType].large;
    return imageSizes[imageType].extraLarge;
  };

  // Helper function to get responsive padding
  const getPadding = (basePadding: number = 16) => {
    const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    return PixelRatio.roundToNearestPixel(basePadding * scale);
  };

  const rw = (size: number) => PixelRatio.roundToNearestPixel(size * (width / BASE_WIDTH));
  const rh = (size: number) => PixelRatio.roundToNearestPixel(size * (height / BASE_HEIGHT));
  const rf = (size: number) => {
    const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    return PixelRatio.roundToNearestPixel(size * scale);
  };
  const rs = (size: number) => {
    const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    return PixelRatio.roundToNearestPixel(size * scale);
  };

  return {
    width,
    height,
    isPortrait: height > width,
    isLandscape: width > height,
    isSmall,
    isMedium,
    isLarge,
    isExtraLarge,
    rw,
    rh,
    rf,
    rs,
    getImageSize,
    getPadding,
  };
};

// Image sizing helpers
export const imageSizes = {
  // Product card images
  productCard: {
    small: { width: 160, height: 120 },
    medium: { width: 180, height: 140 },
    large: { width: 220, height: 180 },
    extraLarge: { width: 280, height: 220 },
  },
  // Product detail main image
  productDetail: {
    small: { height: 250 },
    medium: { height: 300 },
    large: { height: 350 },
    extraLarge: { height: 420 },
  },
  // List item images (cart, search)
  listItem: {
    small: { width: 70, height: 70 },
    medium: { width: 80, height: 80 },
    large: { width: 100, height: 100 },
    extraLarge: { width: 120, height: 120 },
  },
  // Thumbnail images
  thumbnail: {
    small: { width: 50, height: 50 },
    medium: { width: 60, height: 60 },
    large: { width: 70, height: 70 },
    extraLarge: { width: 80, height: 80 },
  },
  // Banner images
  banner: {
    small: { height: 150 },
    medium: { height: 180 },
    large: { height: 220 },
    extraLarge: { height: 280 },
  },
};

// Common responsive styles
export const responsiveStyles = {
  // Container padding
  containerPadding: rs(16),

  // Font sizes
  h1: rf(24),
  h2: rf(20),
  h3: rf(18),
  h4: rf(16),
  body: rf(14),
  small: rf(12),

  // Spacing
  spacing: {
    xs: rs(4),
    sm: rs(8),
    md: rs(16),
    lg: rs(24),
    xl: rs(32),
  },

  // Border radius
  borderRadius: {
    sm: rs(4),
    md: rs(8),
    lg: rs(12),
    xl: rs(16),
  },

  // Icon sizes
  iconSize: {
    sm: rs(16),
    md: rs(20),
    lg: rs(24),
    xl: rs(32),
  },
};