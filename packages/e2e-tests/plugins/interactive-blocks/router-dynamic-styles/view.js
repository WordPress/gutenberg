/**
 * View script for the test/router-dynamic-styles block.
 *
 * Bug A — deferred stylesheet (media="not all" → "all"):
 *   render.php outputs a <style id="test-router-deferred-style" media="not all">
 *   element server-side on every page request. view.js finds it by id.
 *   The activateDeferredStyle action sets element.media = "all".
 *
 *   On SPA navigation the fetched page HTML also contains the same element
 *   with media="not all". normalizeMedia() maps "not all" → "all" so the SCS
 *   algorithm recognises the live activated element as the same resource,
 *   keeps it in page.styles, and applyStyles() leaves it enabled.
 *
 * Bug B — plugin-injected stylesheet (no id, via appendChild):
 *   init() appends a <style> element without an id attribute, simulating
 *   plugins like Complianz GDPR that bypass wp_enqueue_style(). Because
 *   this element is appended after the router module has seeded
 *   routerManagedStyles, it is never enrolled and must never be disabled
 *   across any navigation.
 */

/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Deferred stylesheet fixture for Bug A.
 *
 * The element is output by render.php into <head> on every page render,
 * so it is available in the DOM before any JS runs. Using getElementById
 * avoids injecting a duplicate element and ensures the element is present
 * in the server-rendered HTML fetched during SPA navigation (required for
 * the SCS algorithm to match it).
 *
 * @type {HTMLStyleElement}
 */
const deferredStyleEl = /** @type {HTMLStyleElement} */ (
	document.getElementById( 'test-router-deferred-style' )
);

/**
 * Plugin-injected stylesheet fixture for Bug B.
 *
 * Appended inside init() (after module init / router seeding) to simulate
 * a third-party plugin that calls document.head.appendChild() outside
 * WordPress hooks.
 *
 * @type {HTMLStyleElement|null}
 */
let pluginStyleEl = null;

/**
 * Whether the deferred stylesheet was activated in this browser session.
 * Plain module variable — not reactive state — so reading it inside
 * callbacks.init() does not create a reactive subscription.
 */
let deferredActivated = false;

const { state } = store( 'test/router-dynamic-styles', {
	state: {
		/** "active" | "inactive" */
		deferredStyleStatus: 'inactive',
		/** "active" | "inactive" */
		pluginStyleStatus: 'inactive',
	},

	actions: {
		/**
		 * Simulates an iAPI store activating a deferred stylesheet.
		 *
		 * Changes media from "not all" to "all" on the deferred style element
		 * and marks deferredActivated so init() knows to re-check on the next
		 * navigation.
		 */
		activateDeferredStyle() {
			if ( deferredStyleEl ) {
				deferredStyleEl.media = 'all';
			}
			deferredActivated = true;
			state.deferredStyleStatus = 'active';
		},
	},

	callbacks: {
		/**
		 * Runs on every SPA page mount (data-wp-init on the block wrapper).
		 *
		 * Sets up the plugin fixture on the first run. On subsequent runs
		 * re-verifies that both sheets survived the router's applyStyles() call,
		 * which executes before iAPI re-initialises directives.
		 */
		init() {
			// Bug B fixture — inject a <style> without an id on first mount.
			// Subsequent mounts reuse the existing element if it is still in
			// <head>; if not, re-inject (e.g. after a full page reload).
			if (
				! pluginStyleEl ||
				! document.head.contains( pluginStyleEl )
			) {
				pluginStyleEl = document.createElement( 'style' );
				pluginStyleEl.textContent = 'body { --test-plugin-active: 1; }';
				document.head.appendChild( pluginStyleEl );
			}

			// Bug B status.
			const pluginSheet = pluginStyleEl.sheet;
			state.pluginStyleStatus =
				! pluginSheet || ! pluginSheet.disabled ? 'active' : 'inactive';

			// Bug A status — re-check only after the user has activated the
			// sheet. Before activation deferredStyleStatus stays "inactive"
			// as set by the initial state declaration above.
			if ( deferredActivated ) {
				const sheet = deferredStyleEl && deferredStyleEl.sheet;
				state.deferredStyleStatus =
					sheet && ! sheet.disabled ? 'active' : 'inactive';
			}
		},
	},
} );
