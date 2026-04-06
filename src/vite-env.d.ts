/// <reference types="vite/client" />

interface Window {
  dataLayer: Record<string, any>[];
  fbq: (...args: any[]) => void;
  _fbPixelId: string;
}
