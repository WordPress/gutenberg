/**
 * Jest harness for `@wordpress/interactivity-router` unit tests.
 *
 * `packages/interactivity/src/index.ts` opens with a top-level
 * `await import( 'preact/debug' )`, which Babel's CJS output keeps verbatim —
 * so any Jest suite that imports `@wordpress/interactivity` (or anything
 * reaching it, like the router) fails to parse before a single test runs
 * (investigation fact 1). Every router test file works around this with:
 *
 *     jest.mock( '@wordpress/interactivity', () => require( './__fixtures__/interactivity-shim' ) );
 *
 * which swaps in this module wholesale wherever the router imports
 * `@wordpress/interactivity`. This file assembles the *real* implementations
 * of everything the shipped router destructures from `privateApis`
 * (investigation fact 2): nine from the deep source modules under
 * `packages/interactivity/src`, and `render`, `h` and `batch` straight from
 * `preact` / `@preact/signals` — not from a source module, which does not
 * export them — exactly as `packages/interactivity/src/index.ts` itself
 * sources them.
 *
 * It also re-exports `withScope` and `populateServerData` as top-level named
 * exports (not only bundled inside `privateApis`), because `jest.mock`'s
 * factory replaces the whole module: anything a test imports from
 * `@wordpress/interactivity` directly has to be provided here too.
 * `withScope` is a public export of the real package and is load-bearing for
 * a later task's reddening row; `populateServerData` lets tests seed
 * `getConfig()` directly (e.g. to simulate `clientNavigationDisabled`).
 *
 * Jest's `testMatch` glob `**\/test/*.[jt]s?(x)` is non-recursive, so this
 * `__fixtures__` subdirectory is never itself collected as a test suite.
 */

/**
 * External dependencies
 */
import { render, h } from 'preact';
import { batch } from '@preact/signals';

/**
 * Internal dependencies — the real source modules under
 * packages/interactivity/src, reached directly rather than through
 * packages/interactivity/src/index.ts (see the module comment above).
 */
import {
	getRegionRootFragment,
	initialVdomPromise,
} from '../../../../interactivity/src/hydration';
import { toVdom } from '../../../../interactivity/src/vdom';
import {
	store,
	getConfig,
	parseServerData,
	populateServerData,
} from '../../../../interactivity/src/store';
import { routerRegions } from '../../../../interactivity/src/directives/router-region';
import {
	navigationSignal,
	sessionId,
	warn,
	afterNextFrame,
	withScope,
} from '../../../../interactivity/src/utils';
import { getScope } from '../../../../interactivity/src/scopes';

// Registers the real directive set (data-wp-watch, data-wp-on,
// data-wp-router-region, …) as a side effect, so a test that hydrates real
// markup exercises real directive behaviour.
import '../../../../interactivity/src/directives';

const requiredConsent =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';

/**
 * Stand-in for `@wordpress/interactivity`'s `privateApis`, gated behind the
 * same consent string as the real thing, returning the real implementations
 * of every entry the router destructures.
 *
 * @param lock The consent string.
 * @return The private APIs bundle.
 */
function privateApis( lock: string ) {
	if ( lock === requiredConsent ) {
		return {
			getRegionRootFragment,
			initialVdomPromise,
			toVdom,
			render,
			parseServerData,
			populateServerData,
			batch,
			routerRegions,
			h,
			navigationSignal,
			sessionId,
			warn,
			afterNextFrame,
			getScope,
		};
	}

	throw new Error( 'Forbidden access.' );
}

export { store, getConfig, privateApis, withScope, populateServerData };
