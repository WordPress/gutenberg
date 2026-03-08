/**
 * View script for the test/router-dynamic-styles block.
 *
 * Bug A — deferred stylesheet (media="not all" → "all"):
 *   A <style id="test-deferred-style" media="not all"> element is injected
 *   at module evaluation time (outside any callback), before the iAPI router
 *   module runs and seeds routerManagedStyles. This guarantees the element
 *   is present in the DOM when routerManagedStyles is seeded, so the router
 *   treats it as a managed stylesheet and will not disable it on navigation.
 *   The activateDeferredStyle action sets media="all". After navigation,
 *   init() re-checks sheet.disabled to verify the router preserved the
 *   activated sheet.
 *
 * Bug B — plugin-injected stylesheet (no id, via appendChild):
 *   init() appends a <style> element without an id attribute, simulating
 *   plugins like Complianz GDPR that bypass wp_enqueue_style(). Because
 *   this element is appended after module init the router never enrolls it
 *   in routerManagedStyles and must never disable it across any navigation.
 */

/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Deferred stylesheet fixture for Bug A.
 *
 * Injected at module evaluation time so it is present in the DOM when the
 * router module runs and seeds routerManagedStyles. The element carries
 * id="test-deferred-style" so it is enrolled in the managed set.
 *
 * media="not all" mirrors the WordPress deferred-enqueue pattern. The
 * activateDeferredStyle action changes it to "all".
 *
 * @type {HTMLStyleElement}
 */
const deferredStyleEl = document.createElement( 'style' );
deferredStyleEl.id = 'test-deferred-style';
deferredStyleEl.media = 'not all';
deferredStyleEl.textContent = 'body { --test-deferred-active: 1; }';
document.head.appendChild( deferredStyleEl );

/**
 * Plugin-injected stylesheet fixture for Bug B.
 *
 * Appended inside init() (after module init) to simulate a third-party
 * plugin that calls document.head.appendChild() outside WordPress hooks.
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
			deferredStyleEl.media = 'all';
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
				pluginStyleEl.textContent =
					'body { --test-plugin-active: 1; }';
				document.head.appendChild( pluginStyleEl );
			}

			// Bug B status.
			const pluginSheet = pluginStyleEl.sheet;
			state.pluginStyleStatus =
				! pluginSheet || ! pluginSheet.disabled 
					? 'active'
					: 'inactive';

			// Bug A status — re-check only after the user has activated the
			// sheet. Before activation deferredStyleStatus stays "inactive"
			// as set by the initial state declaration above.
			if ( deferredActivated ) {
				const sheet = deferredStyleEl.sheet;
				state.deferredStyleStatus =
					sheet && ! sheet.disabled 
						? 'active'
						: 'inactive';
			}
		},
	},
} );
