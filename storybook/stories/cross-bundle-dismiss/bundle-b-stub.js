/**
 * Stub for @cross-bundle-test/bundle-b.
 *
 * Used when the pre-built ESM bundle doesn't exist (e.g., CI Storybook build).
 * Build the real bundles with:
 *   node packages/e2e-tests/plugins/overlay-dismiss-stress-test/build-bundles.mjs
 */

const stub = () => null;

export const Dialog = new Proxy( {}, { get: () => stub } );
export const Select = new Proxy( {}, { get: () => stub } );
export const Popover = new Proxy( {}, { get: () => stub } );
export const Menu = new Proxy( {}, { get: () => stub } );
export const Tooltip = new Proxy( {}, { get: () => stub } );
