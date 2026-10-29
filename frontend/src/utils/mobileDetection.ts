/**
 * Mobile detection and Web3 deep linking utilities for SolScavenger
 */

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isInAppWalletBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  return Boolean(win.solana || win.phantom?.solana || win.solflare);
};

export const getCleanCurrentUrl = (): string => {
  if (typeof window === 'undefined') return 'https://solscavenger.app';
  // Use https://solscavenger.app in production or current origin in local testing
  const origin = window.location.origin;
  return origin.includes('localhost') ? 'https://solscavenger.app' : origin;
};

/**
 * Universal Link to open SolScavenger inside the Phantom in-app browser
 */
export const getPhantomDeepLink = (targetUrl?: string): string => {
  const url = targetUrl || getCleanCurrentUrl();
  const encodedUrl = encodeURIComponent(url);
  const encodedRef = encodeURIComponent(getCleanCurrentUrl());
  return `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedRef}`;
};

/**
 * Universal Link to open SolScavenger inside the Solflare in-app browser
 */
export const getSolflareDeepLink = (targetUrl?: string): string => {
  const url = targetUrl || getCleanCurrentUrl();
  const encodedUrl = encodeURIComponent(url);
  const encodedRef = encodeURIComponent(getCleanCurrentUrl());
  return `https://solflare.com/ul/v1/browse/${encodedUrl}?ref=${encodedRef}`;
};
