/**
 * View script for the test/router-dynamic-styles block.
 *
 * Implements two style-scenario fixtures used by router-dynamic-styles.spec.ts:
 *
 * Bug A — deferred stylesheet (media="not all" → "all"):
 *   activateDeferredStyle() mutates the WordPress-enqueued link element's media
 *   attribute to "all", exactly as an iAPI theme-switcher store would do.
 *   deferredStyleStatus is set to "active" immediately in the action.
 *   On the next navigation init() re-verifies the sheet survived applyStyles()
 *   by checking link.sheet.disabled directly (no CSS custom property involved).
 *
 * Bug B — plugin-injected stylesheet (no id, via appendChild):
 *   init() appends a <style> element without an id attribute, simulating plugins
 *   like Complianz GDPR that bypass wp_enqueue_style(). The router must never
 *   enroll or disable this element. init() checks sheet.disabled after every
 *   page mount — applyStyles() runs before iAPI re-initialises directives, so
 *   the value is already final when init() reads it.
 */

/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Module-scoped reference to the simulated plugin stylesheet.
 * Lives outside the store so it persists across SPA navigations.
 *
 * @type {HTMLStyleElement|null}
 */
let pluginStyleEl = null;

/**
 * Whether the deferred stylesheet was activated in this browser session.
 * Plain module variable — not reactive state — so reading it inside
 * callbacks.init() does not create a reactive subscription and will not
 * cause init() to re-run when the action changes it.
 */
let deferredActivated = false;

const { state } = store( 'test/router-dynamic-styles', {
	state: {
		/** "active" | "inactive" — shown in data-testid="deferred-style-active". */
		deferredStyleStatus: 'inactive',
		/** "active" | "inactive" — shown in data-testid="plugin-style-active". */
		pluginStyleStatus: 'inactive',
	},

	actions: {
		/**
		 * Simulates an iAPI theme-switcher activating a deferred stylesheet.
		 *
		 * Sets deferredStyleStatus to "active" immediately (synchronous action
		 * result visible before the next navigate()). On the next navigation
		 * callbacks.init() will re-verify via sheet.disabled.
		 */
		activateDeferredStyle() {
			const link = /** @type {HTMLLinkElement|null} */ (
				document.querySelector(
					'#test-router-dynamic-styles-deferred-css'
				)
			);
			if ( link ) {
				link.media = 'all';
			}
			// Mark as activated using a plain module variable so that
			// callbacks.init() can re-check on the next navigation without
			// creating a reactive dependency that would re-run init() here.
			deferredActivated = true;
			// Set state directly from the action — this is the value the spec
			// checks immediately after the button click (before navigation).
			state.deferredStyleStatus = 'active';
		},
	},

	callbacks: {
		/**
		 * Runs on every SPA page mount (data-wp-init on the block wrapper).
		 *
		 * On initial page: sets up Bug B fixture and reports its status.
		 * On subsequent pages: re-verifies both stylesheets survived applyStyles().
		 *
		 * applyStyles() runs before iAPI re-initialises directives, so the
		 * sheet.disabled values observed here are already final for this page.
		 */
		init() {
			// Bug B fixture
			// Inject a <style> element without an id attribute to simulate
			// a plugin that bypasses wp_enqueue_style(). Skipped if the element
			// is already in <head> (persists across SPA navigations).
			if (
				! pluginStyleEl ||
				! document.head.contains( pluginStyleEl )
			) {
				pluginStyleEl = document.createElement( 'style' );
				// Content is arbitrary — just needs a parseable rule.
				pluginStyleEl.textContent = 'body { --test-plugin-active: 1; }';
				// No id attribute — this is the key signal that the element
				// must be left unmanaged by routerManagedStyles.
				document.head.appendChild( pluginStyleEl );
			}

			// Bug B status
			// Inline <style> elements always have a .sheet after appendChild in
			// all modern browsers. Check disabled directly: routerManagedStyles
			// should never have enrolled this element (no id, never preloaded),
			// so applyStyles() must leave sheet.disabled === false.
			const pluginSheet = pluginStyleEl.sheet;
			state.pluginStyleStatus =
				! pluginSheet || ! pluginSheet.disabled ? 'active' : 'inactive';

			// Bug A status
			// Only re-evaluate after the user has activated the deferred sheet.
			// deferredActivated is a plain module var — not reactive state —
			// so reading it here does NOT subscribe init() to future changes.
			// On the initial page visit before button click: skipped, leaving
			// deferredStyleStatus at the value set by activateDeferredStyle().
			if ( deferredActivated ) {
				const link = /** @type {HTMLLinkElement|null} */ (
					document.querySelector(
						'#test-router-dynamic-styles-deferred-css'
					)
				);
				if ( link ) {
					const sheet = link.sheet;
					// If the CSS file returned a 404 the browser sets sheet to
					// null — the router cannot have disabled a non-existent
					// sheet, so treat null as "not disabled" and fall back to
					// the media attribute to confirm activation is preserved.
					if ( sheet !== null ) {
						state.deferredStyleStatus = sheet.disabled
							? 'inactive'
							: 'active';
					} else {
						state.deferredStyleStatus =
							link.media !== 'not all' ? 'active' : 'inactive';
					}
				}
			}
		},
	},
} );
