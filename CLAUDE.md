# @arts/release-deploy-core

Shared TypeScript/React core for the **Release Deploy for EDD** WordPress plugin. It lives in a
pnpm workspace and is consumed by two sibling packages — **Lite (free)** and **Pro**. It supplies
the admin-side UI and client logic that links Easy Digital Downloads *Software Licensing* downloads
to GitHub-hosted release files: a settings token field, a file-status indicator, and version /
changelog sync UI injected into the EDD download metabox.

This package ships the FREE surface. The sync components here are badge-only teasers; the Pro
package supplies the working sync. See "Free vs Pro" below before adding feature logic.

## Commands

pnpm, Node >= 23.

- `pnpm build` — `tsc` emits declarations + JS to `dist/`, then `build.js` (esbuild) bundles ESM to
  `dist/index.js` with **react/react-dom external**, and compiles `src/styles/index.sass` to
  `dist/index.css`. (Check for an existing dev/build process before starting; serialize shared outputs.)
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` — vitest (jsdom).
- Typecheck gate: `pnpm exec tsc --noEmit`. There is no lint script.

## Layout

Only the load-bearing parts; each area's detail lives in its own files.

- `src/constants/` — frozen contracts: `API_ACTIONS`, `EDD_SELECTORS`, `INTERVALS`,
  `GITHUB_PROTOCOL`, `SIZE_UNITS`, `TRANSLATION_FALLBACKS`.
- `src/services/` — `GitHubService`: WordPress admin-ajax client (DI-friendly).
- `src/hooks/` — file/token validation, EDD input monitoring, GitHub-file detection, polling.
- `src/settings/` — `SettingsApp` + `TokenField` (GitHub PAT entry & validation).
- `src/metabox/` — `inject-sync-ui` (imperative DOM injection) + `FileStatus`.
- `src/version-sync/`, `src/changelog-sync/` — free badge-only components + their `init`.
- `src/components/` — `ProBadge` (the "Get Pro" teaser).
- `src/utils/` — `getString` (i18n), `errorHandler`, `github` (protocol URL parse/build), `format`.
- `src/index.ts` barrel · `src/global.d.ts` (window/`wp` globals) · `src/styles/` SASS.
- `tests/` mirrors `src/`. `dist/` is generated — never hand-edit; regenerate with `pnpm build`.

## Runtime contract (hard to infer, breaks silently)

- Everything reads the `window.releaseDeployEDD` global (typed `IConfig` in `global.d.ts`),
  injected by the PHP backend: `ajaxUrl`, `features` (per-capability flags), `strings`
  (translations), and `contexts` (`settings` / `metabox` / `browser` / `webhook` / `license`).
  It may be absent — always access with optional chaining, as the code does.
- React is the WordPress `wp.element` global; the bundle marks react/react-dom external. Do not
  introduce a bundled React runtime.

## Conventions & gotchas

- **i18n:** never hardcode UI strings. Call `getString(key)`; `key` must be typed in `IStringKeys`
  and have an English fallback in `TRANSLATION_FALLBACKS`. Live strings come from
  `window.releaseDeployEDD.strings` (PHP), falling back to the constant.
- **GitHub files** use the custom URL scheme `edd-release-deploy://owner/repo/release/filename`
  (`GITHUB_PROTOCOL`); parse/build via `utils/github.ts`.
- **Server calls** go through `GitHubService` over admin-ajax (FormData: `action` + `nonce` +
  payload). Action names are frozen in `API_ACTIONS` (`edd_release_deploy_*`) and shared with PHP.
  `createGitHubService(fetcher)` injects a fetch stub in tests.
- **EDD metabox seam (brittle):** sync UI is injected next to EDD Software Licensing fields after a
  ~100ms wait for EDD SL to render, located via `EDD_SELECTORS`. Injection inserts a root
  `<div id="release-deploy-edd-{version|changelog}-sync-{pro|free}-root">` then dispatches a
  CustomEvent (`release-deploy-edd-version-sync-ready` / `...-changelog-sync-ready`) to mount React.
  Sensitive to EDD SL markup changes.
- **Input polling:** file inputs are polled every `INTERVALS.POLL` (600ms) because EDD's media
  library sets `input.value` directly without firing input/change events; the last seen value is
  tracked in a `data-prev-value` attribute.
- **Free vs Pro:** `VersionSync` / `ChangelogSync` here are intentionally badge-only. The
  `isFeatureAvailable` prop gates the real feature vs the "Get Pro" badge. Functional sync belongs
  in the Pro package — don't add it to core.

## Frozen identifiers

`window.releaseDeployEDD` · `edd-release-deploy://` · `edd_release_deploy_*` AJAX actions
(`constants/api.ts`) · events `release-deploy-edd-version-sync-ready` /
`release-deploy-edd-changelog-sync-ready` · root ids
`release-deploy-edd-{version|changelog}-sync-{pro|free}-root` · PHP token constant
`EDD_RELEASE_DEPLOY_TOKEN` (wp-config.php) · CSS prefixes `release-deploy-edd-*` and
`arts-license-pro-badge*`.

## Dependencies

Runtime dep: `dompurify` (XSS-safe decoding of API error messages in `useFileValidation`). Peers
(host-provided): `@wordpress/element`, `@wordpress/api-fetch`, `@wordpress/i18n`, `react`,
`react-dom`. Build/test: esbuild, sass, typescript, vitest + @testing-library, jsdom.

## Testing

vitest + jsdom; `tests/setup.ts` mocks `wp.element` / `wp.components` and jsdom timer globals, and
each test supplies its own `window.releaseDeployEDD`. Coverage excludes barrels, `types/`,
`interfaces/`, and `constants/`.
