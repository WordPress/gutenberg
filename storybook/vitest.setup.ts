/**
 * Vitest keeps one browser page per worker and runs each story file in a new
 * iframe inside it. Chromium is slow to reclaim the detached iframes, and once
 * enough of them pile up it drops the page's connection to Vitest, which fails
 * the run with "Browser connection was closed while running tests". A full
 * garbage collection before each file keeps the page healthy. `gc` is exposed
 * by the `--js-flags=--expose-gc` launch argument in `vitest.config.ts`.
 */
if ( typeof globalThis.gc !== 'function' ) {
	throw new Error(
		'Storybook tests require Chromium to expose garbage collection.'
	);
}

globalThis.gc();
