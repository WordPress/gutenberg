/**
 * View script for the test/router-dynamic-styles block.
 *
 * Implements two style-scenario fixtures used by router-dynamic-styles.spec.ts:
 *
 * Bug A — deferred stylesheet (media="not all" → "all"):
 *   activateDeferredStyle() mutates the WordPress-enqueued link element's media
 *   attribute to "all". After SPA navigation, areNodesEqual() must match the live
 *   element (media="all") with the server-returned element (media="not all") so
 *   that applyStyles() does not disable the activated sheet.
 *   Detection: deferred-style.css sets a CSS custom property on <body>; the init
 *   callback reads it via getComputedStyle to determine active/inactive status.
 *
 * Bug B — plugin-injected stylesheet (no id, via appendChild):
 *   init() appends a <style> element without an id attribute, simulating plugins
 *   like Complianz GDPR that bypass wp_enqueue_style(). The router must never
 *   enroll or disable this element.
 *   Detection: the <style>'s sheet.disabled property is checked directly after
 *   each navigation — it must remain false throughout.
 */

/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Module-scoped reference to the simulated plugin stylesheet.
 *
 * Lives outside the store so it persists across SPA navigations without
 * depending on store-state serialisation or server-rendered context.
 *
 * @type {HTMLStyleElement|null}
 */
let pluginStyleEl = null;

const { state, actions, callbacks } = store( 'test/router-dynamic-styles', {
	state: {
		/** Text shown in data-testid="deferred-style-active". */
		deferredStyleStatus: 'inactive',
		/** Text shown in data-testid="plugin-style-active". */
		pluginStyleStatus: 'inactive',
	},

	actions: {
		/**
		 * Activates the WordPress-enqueued deferred stylesheet by changing its
		 * `media` attribute from "not all" to "all", exactly as an iAPI
		 * theme-switcher store would do.
		 *
		 * Sets deferredStyleStatus immediately (synchronously) so the indicator
		 * updates before the next navigation.
		 */
		activateDeferredStyle() {
			const link = /** @type {HTMLLinkElement|null} */ (
				document.querySelector(
					'#test-router-dynamic-styles-deferred-css'
				)
			);
			if ( link ) {
				link.media = 'all';
				// Set status immediately; init() will re-verify on next navigation.
				state.deferredStyleStatus = 'active';
			}
		},
	},

	callbacks: {
		/**
		 * Runs on every SPA page mount (via data-wp-init on the block wrapper).
		 *
		 * 1. Injects a plugin-style <style> element without an id (Bug B fixture).
		 *    Skipped if the element is already present in <head>.
		 *
		 * 2. Reads the current state of both stylesheets and updates the store so
		 *    the data-testid indicator spans reflect the post-navigation result.
		 *
		 * applyStyles() runs before iAPI re-initialises elements, so the
		 * sheet.disabled values observed here are already final for this page.
		 */
		init() {
			// ── Bug B fixture ────────────────────────────────────────────────
			// Inject only once; subsequent init() calls (on page B, C, back to A)
			// reuse the same element already in <head>.
			if (
				! pluginStyleEl ||
				! document.head.contains( pluginStyleEl )
			) {
				pluginStyleEl = document.createElement( 'style' );
				// Sets a detectable CSS custom property — disabled sheet → no property.
				pluginStyleEl.textContent =
					'body { --test-plugin-active: 1; }';
				// Deliberately NO `id` attribute.
				// wp_enqueue_style() always produces id="{handle}-css"; the absence
				// of an id is the key signal that this element must be left unmanaged.
				document.head.appendChild( pluginStyleEl );
			}

			// ── Status update ────────────────────────────────────────────────
			const cs = window.getComputedStyle( document.body );

			// Bug A: deferred-style.css sets --test-deferred-active: 1 on body.
			// If applyStyles() preserved the activated sheet, the property is "1".
			// If it incorrectly disabled the sheet, the property is "".
			state.deferredStyleStatus =
				cs.getPropertyValue( '--test-deferred-active' ).trim() === '1'
					? 'active'
					: 'inactive';

			// Bug B: check sheet.disabled directly.
			// routerManagedStyles must NOT contain pluginStyleEl (no id, never
			// activated from preload state), so applyStyles() must leave it alone.
			state.pluginStyleStatus =
				pluginStyleEl &&
				( ! pluginStyleEl.sheet ||
					! pluginStyleEl.sheet.disabled )
					? 'active'
					: 'inactive';
		},
	},
} );
