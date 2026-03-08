/**
 * View script for the test/router-dynamic-styles block.
 *
 * Implements two style-scenario fixtures:
 *
 * Bug A — deferred stylesheet (media="not all" → "all"):
 *   On first init() an inline <style id="test-deferred-style"> is injected
 *   with media="not all". The activateDeferredStyle action sets link.media
 *   to "all". On subsequent navigations init() re-checks sheet.disabled to
 *   verify the router did not disable the activated sheet.
 *
 *   Using an inline <style> injected by JS (rather than a PHP-enqueued
 *   external <link>) removes the dependency on file loading and
 *   wp_enqueue_style timing, making the fixture deterministic across all
 *   CI environments.
 *
 * Bug B — plugin-injected stylesheet (no id, via appendChild):
 *   init() appends a <style> element without an id attribute, simulating
 *   plugins like Complianz GDPR that bypass wp_enqueue_style(). The router
 *   must never disable it. routerManagedStyles only enrolls sheets it
 *   activates from media="preload" state; this element never goes through
 *   that path and is therefore never enrolled.
 */

/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Inline <style> element used as the deferred stylesheet fixture (Bug A).
 * Injected once on the first page load and left in <head> for the entire
 * browser session. The element receives id="test-deferred-style" so the
 * router enrolls it in routerManagedStyles (seeded from all elements with
 * an id at module init).
 *
 * @type {HTMLStyleElement|null}
 */
let deferredStyleEl = null;

/**
 * Inline <style> element injected without an id (Bug B fixture).
 * Simulates a third-party plugin stylesheet appended after module init.
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
		 * Sets link.media from "not all" to "all" on the inline style element
		 * injected by init(). Sets deferredStyleStatus to "active" immediately
		 * so the spec assertion after the button click passes before navigation.
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
		 * Sets up both style fixtures on the first run. On subsequent runs
		 * re-verifies that both sheets survived the router's applyStyles() call,
		 * which runs before iAPI re-initialises directives.
		 */
		init() {
			// Bug A fixture — inject an inline <style> with media="not all".
			// The element receives id="test-deferred-style" so it is enrolled
			// in routerManagedStyles at module init time (seeded from all DOM
			// elements present when the module first runs).
			if (
				! deferredStyleEl ||
				! document.head.contains( deferredStyleEl )
			) {
				deferredStyleEl = document.createElement( 'style' );
				deferredStyleEl.id = 'test-deferred-style';
				deferredStyleEl.media = 'not all';
				deferredStyleEl.textContent =
					'body { --test-deferred-active: 1; }';
				document.head.appendChild( deferredStyleEl );
			}

			// Bug B fixture — inject a <style> without an id.
			if (
				! pluginStyleEl ||
				! document.head.contains( pluginStyleEl )
			) {
				pluginStyleEl = document.createElement( 'style' );
				pluginStyleEl.textContent =
					'body { --test-plugin-active: 1; }';
				document.head.appendChild( pluginStyleEl );
			}

			// Bug B status — sheet.disabled must remain false because
			// routerManagedStyles never enrolls elements without an id that
			// were not present at module init time.
			const pluginSheet = pluginStyleEl.sheet;
			state.pluginStyleStatus =
				! pluginSheet || ! pluginSheet.disabled
					? 'active'
					: 'inactive';

			// Bug A status — re-check only after the user has activated the
			// sheet. Before activation deferredStyleStatus stays at the value
			// set by activateDeferredStyle() (or the initial "inactive").
			if ( deferredActivated ) {
				if ( deferredStyleEl ) {
					const sheet = deferredStyleEl.sheet;
					if ( sheet !== null ) {
						state.deferredStyleStatus = sheet.disabled
							? 'inactive'
							: 'active';
					} else {
						// sheet is null when media="not all" in some browsers —
						// fall back to checking the media attribute directly.
						state.deferredStyleStatus =
							deferredStyleEl.media !== 'not all'
								? 'active'
								: 'inactive';
					}
				}
			}
		},
	},
} );
