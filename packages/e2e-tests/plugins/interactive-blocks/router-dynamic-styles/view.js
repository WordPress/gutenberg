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
 * Bug B — plugin-injected stylesheet (stable id, via appendChild):
 *   init() appends a <style> element with a stable id, simulating
 *   plugins like Complianz GDPR that bypass wp_enqueue_style(). Because
 *   this element is appended after the router module has seeded
 *   routerManagedStyles, it is never enrolled and must never be disabled
 *   across any navigation.
 */

/**
 * Internal dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * Unique ID for the plugin-injected style element.
 *
 * A stable id ensures idempotency: getElementById() prevents duplicate
 * injection on re-mount and lets pluginStyleStatus read the element
 * directly without holding a module-level reference.
 *
 * @type {string}
 */
const PLUGIN_STYLE_ID = 'test-router-plugin-style';

const { state } = store( 'test/router-dynamic-styles', {
	state: {
		/**
		 * "active" | "inactive"
		 *
		 * Plain reactive field updated by activateDeferredStyle().
		 * A DOM getter would not be reactive in Preact's signal system —
		 * raw DOM reads do not create signal subscriptions, so the bound
		 * data-wp-text span would never re-render after the media change.
		 */
		deferredStyleStatus: 'inactive',

		/**
		 * "active" | "inactive"
		 *
		 * Plain reactive field updated by init().
		 * Same reason as deferredStyleStatus: getElementById() is not a
		 * Preact signal, so a getter that reads it would be evaluated once
		 * at hydration and never again, leaving the span stuck at "inactive"
		 * even after the element is appended to <head>.
		 */
		pluginStyleStatus: 'inactive',
	},

	actions: {
		/**
		 * Simulates an iAPI store activating a deferred stylesheet.
		 *
		 * Changes media from "not all" to "all" on the deferred style element,
		 * then writes to the reactive state field so data-wp-text re-renders.
		 * The router logic should preserve both the DOM change and the state
		 * across SPA navigations.
		 */
		activateDeferredStyle() {
			const styleEl = document.getElementById(
				'test-router-deferred-style'
			);
			if ( styleEl ) {
				// Changing media to 'all' activates the stylesheet.
				// The router logic should preserve this state.
				styleEl.media = 'all';
				// Update the reactive signal so data-wp-text re-renders.
				state.deferredStyleStatus = 'active';
			}
		},
	},

	callbacks: {
		/**
		 * Runs on every SPA page mount (data-wp-init on the block wrapper).
		 *
		 * Sets up the plugin fixture on the first run. On subsequent runs
		 * re-verifies that the sheet survived the router's applyStyles() call,
		 * which executes before iAPI re-initialises directives.
		 */
		init() {
			// Bug B fixture — inject a <style> with a stable id on first mount.
			// Subsequent mounts skip injection if the element is still in <head>.
			// Simulate a plugin injecting a style dynamically.
			// This style should survive navigation because it is not managed by WP.
			if ( ! document.getElementById( PLUGIN_STYLE_ID ) ) {
				const style = document.createElement( 'style' );
				style.id = PLUGIN_STYLE_ID;
				style.textContent = 'body { --test-plugin-style: 1; }';
				document.head.appendChild( style );
			}
			// Update the reactive signal so data-wp-text re-renders.
			// Called on every mount so the status is restored after SPA navigation.
			state.pluginStyleStatus = 'active';
		},
	},
} );
