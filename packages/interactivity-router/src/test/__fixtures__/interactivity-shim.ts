/**
 * Vitest harness for `@wordpress/interactivity-router` unit tests.
 *
 * The router tests mock `@wordpress/interactivity` with this module so they
 * can use the real directive-runtime implementations from the deep source
 * modules while keeping the private API seam under test:
 *
 *     vi.mock( import( '@wordpress/interactivity' ), async () => await import( './__fixtures__/interactivity-shim' ) );
 *
 * The mock swaps in this module wholesale wherever the router imports
 * `@wordpress/interactivity`. This file assembles the *real* implementations
 * of everything the shipped router destructures from `privateApis`. The
 * `render`, `h`, and `batch` entries come straight from `preact` /
 * `@preact/signals` — not from a source module, which does not export them —
 * exactly as `packages/interactivity/src/index.ts` itself sources them.
 *
 * It also re-exports `watch`, `withScope`, and `populateServerData` as top-level
 * exports (not only bundled inside `privateApis`), because `vi.mock`'s
 * factory replaces the whole module: anything a test imports from
 * `@wordpress/interactivity` directly has to be provided here too. The
 * `watch` and `withScope` are public exports of the real package and are
 * load-bearing for watcher scope behavior and scoped calls, while
 * `populateServerData` lets tests seed `getConfig()` directly (e.g. to
 * simulate `clientNavigationDisabled`).
 *
 * Vitest's `**\/test/*.[jt]s?(x)` include glob does not collect this
 * `__fixtures__` subdirectory as a test suite.
 */

import { render, h } from 'preact';
import { batch } from '@preact/signals';
import * as hydrationApis from '../../../../interactivity/src/hydration';
import * as vdomApis from '../../../../interactivity/src/vdom';
import * as storeApis from '../../../../interactivity/src/store';
import * as routerRegionApis from '../../../../interactivity/src/directives/router-region';
import * as utilsApis from '../../../../interactivity/src/utils';
import * as scopeApis from '../../../../interactivity/src/scopes';
// Registers the real directive set (data-wp-watch, data-wp-on,
// data-wp-router-region, …) as a side effect, so a test that hydrates real
// markup exercises real directive behaviour.
import '../../../../interactivity/src/directives';
export {
	store,
	getConfig,
	populateServerData,
} from '../../../../interactivity/src/store';
export { watch, withScope } from '../../../../interactivity/src/utils';

const requiredConsent =
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.';

/**
 * Stand-in for `@wordpress/interactivity`'s `privateApis`, gated behind the
 * same consent string as the real thing, returning the real implementations
 * of every entry the router destructures.
 *
 * @param lock The consent string.
 * @return The private APIs bundle, including the shared directive-value parser.
 */
function privateApis( lock: string ) {
	if ( lock === requiredConsent ) {
		return {
			getRegionRootFragment: hydrationApis.getRegionRootFragment,
			initialVdomPromise: hydrationApis.initialVdomPromise,
			toVdom: vdomApis.toVdom,
			// Shares the directive runtime's interpretation with router consumers.
			parseDirectiveValue: vdomApis.parseDirectiveValue,
			render,
			parseServerData: storeApis.parseServerData,
			populateServerData: storeApis.populateServerData,
			batch,
			routerRegions: routerRegionApis.routerRegions,
			h,
			navigationSignal: utilsApis.navigationSignal,
			sessionId: utilsApis.sessionId,
			warn: utilsApis.warn,
			afterNextFrame: utilsApis.afterNextFrame,
			getScope: scopeApis.getScope,
		};
	}

	throw new Error( 'Forbidden access.' );
}

export { privateApis };
