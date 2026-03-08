/**
 * View script for the test/router-dynamic-styles block.
 *
 * Bug A — deferred stylesheet (media="not all" → "all"):
 *   deferred-style.css is registered via block.json viewStyle with
 *   media="not all" set by render.php via wp_style_add_data(). Its
 *   WordPress-generated id is "test-router-dynamic-styles-style-css".
 *   activateDeferredStyle() mutates link.media to "all".
 *   On next navigation init() re-verifies the sheet survived applyStyles().
 *
 * Bug B — plugin-injected stylesheet (no id, via appendChild):
 *   init() appends a <style> without an id, simulating Complianz GDPR and
 *   similar plugins that bypass wp_enqueue_style(). The router must never
 *   disable it — routerManagedStyles only enrolls sheets it activates from
 *   media="preload" state; plugin-injected sheets never go through that path.
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
					'#test-router-dynamic-styles-style-css'
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

			// Bug A status — re-check after activation.
			if ( deferredActivated ) {
				const link = /** @type {HTMLLinkElement|null} */ (
					document.querySelector(
						'#test-router-dynamic-styles-style-css'
					)
				);
				if ( link ) {
					const sheet = link.sheet;
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
