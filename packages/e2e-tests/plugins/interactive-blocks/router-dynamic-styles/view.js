/**
 * View script for the test/router-dynamic-styles block.
 *
 * Implements two style-scenario fixtures:
 *
 * Bug A — deferred stylesheet (media="not all" → "all"):
 *   activateDeferredStyle() mutates the WordPress-enqueued link element's media
 *   attribute to "all", exactly as an iAPI theme-switcher store would do.
 *   On the next navigation init() re-verifies the sheet survived applyStyles()
 *   by checking link.sheet.disabled directly.
 *
 * Bug B — plugin-injected stylesheet (no id, via appendChild):
 *   init() appends a <style> element without an id attribute, simulating
 *   plugins like Complianz GDPR that bypass wp_enqueue_style(). This element
 *   is created on every init() call that finds it absent, so it is present
 *   during the initial page load but also re-created if removed.
 *   The router must never disable it — routerManagedStyles only enrolls
 *   elements it explicitly activates from media="preload" state.
 */

/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/** @type {HTMLStyleElement|null} */
let pluginStyleEl = null;
let deferredActivated = false;

const { state } = store( 'test/router-dynamic-styles', {
	state: {
		deferredStyleStatus: 'inactive',
		pluginStyleStatus: 'inactive',
	},

	actions: {
		activateDeferredStyle() {
			const link = /** @type {HTMLLinkElement|null} */ (
				document.querySelector(
					'#test-router-dynamic-styles-deferred-css'
				)
			);
			if ( link ) {
				link.media = 'all';
			}
			deferredActivated = true;
			state.deferredStyleStatus = 'active';
		},
	},

	callbacks: {
		init() {
			// Bug B fixture — inject a plugin-like <style> without an id.
			// Created once and persists across SPA navigations in pluginStyleEl.
			if (
				! pluginStyleEl ||
				! document.head.contains( pluginStyleEl )
			) {
				pluginStyleEl = document.createElement( 'style' );
				pluginStyleEl.textContent = 'body { --test-plugin-active: 1; }';
				document.head.appendChild( pluginStyleEl );
			}

			// Bug B status — check sheet.disabled.
			// routerManagedStyles only enrolls elements it activates from
			// media="preload"; plugin-injected elements never go through that
			// path and must never be disabled.
			const pluginSheet = pluginStyleEl.sheet;
			state.pluginStyleStatus =
				! pluginSheet || ! pluginSheet.disabled ? 'active' : 'inactive';

			// Bug A status — re-check after activation.
			if ( deferredActivated ) {
				const link = /** @type {HTMLLinkElement|null} */ (
					document.querySelector(
						'#test-router-dynamic-styles-deferred-css'
					)
				);
				if ( link ) {
					const sheet = link.sheet;
					// null sheet = CSS file failed to load; router cannot
					// have disabled it, so treat as preserved (active).
					if ( sheet === null || ! sheet.disabled ) {
						state.deferredStyleStatus = 'active';
					} else {
						state.deferredStyleStatus = 'inactive';
					}
				}
			}
		},
	},
} );
