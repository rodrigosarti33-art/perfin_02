import { lerSiteUrl } from './esquemas';

// Acesso literal a process.env.NEXT_PUBLIC_SITE_URL: é o que o Next substitui no build.
export function obterSiteUrl(): string {
  return lerSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}
