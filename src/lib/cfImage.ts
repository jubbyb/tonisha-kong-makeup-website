// Cloudflare Image Transformations URL builder. Only rewrites URLs hosted on
// our R2 public domain; external URLs (legacy paste-URL items) pass through.
const PORTFOLIO_PUBLIC_BASE =
  (import.meta.env.VITE_PORTFOLIO_PUBLIC_BASE as string | undefined) ?? 'https://images.styleja.com';

export function cfImage(url: string, width: number, fit: 'cover' | 'contain' = 'cover'): string {
  if (!url || !url.startsWith(PORTFOLIO_PUBLIC_BASE)) return url;
  return `${url}?width=${width}&format=auto&fit=${fit}`;
}
