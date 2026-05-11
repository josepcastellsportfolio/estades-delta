import type { ConfigType } from '@plone/registry';
import MarketplaceBodyPalette from '../components/MarketplaceBodyPalette';

/**
 * Marketplace boots with `data-palette="arrossar"` on `<body>`.
 *
 * We do this through Volto's `config.settings.appExtras` slot rather than
 * `htmlBodyAttributes` (which exists for Plone Classic, not Volto 18): a
 * regular React component mounted inside <AppExtras> uses Helmet to push the
 * attribute on <body>. PropertyView and other tenant-specific subtrees
 * override the cascade via <PaletteScope palette={...}> wrappers rather
 * than mutating the body again.
 */
export default function installPalette(config: ConfigType) {
  const settings = config.settings as Record<string, unknown>;
  const existing = (settings.appExtras as unknown[]) || [];
  settings.appExtras = [
    ...existing,
    {
      // react-router matchPath: match every path under "/" (non-exact),
      // i.e. effectively every page in the site.
      match: { path: '/', exact: false, strict: false },
      component: MarketplaceBodyPalette,
    },
  ];
  return config;
}
