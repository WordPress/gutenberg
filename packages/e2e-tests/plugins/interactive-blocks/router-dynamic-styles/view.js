/**
 * WordPress dependencies
 */
import { store, getElement } from '@wordpress/interactivity';

const PLUGIN_STYLE_ID = 'test-router-plugin-style';

const { state } = store( 'test/router-dynamic-styles', {
	state: {
		/**
		 * "active" | "inactive". Written by activateDeferredStyle() and
		 * re-synchronised from the real DOM by init() on every SPA mount.
		 *
		 * Must be a plain reactive field, not a DOM getter: raw DOM reads are
		 * not tracked by Preact's signal system, so a getter would be evaluated
		 * once at hydration and never again, leaving the span stuck at "inactive".
		 */
		deferredStyleStatus: 'inactive',

		/**
		 * "active" | "inactive". Written by init() on every SPA mount.
		 * Plain reactive field for the same reason as deferredStyleStatus.
		 */
		pluginStyleStatus: 'inactive',
	},

	actions: {
		/**
		 * Bug A fixture — activates the deferred stylesheet.
		 *
		 * Mutates media from "not all" to "all" on the inline style element, then
		 * writes the reactive signal so data-wp-text re-renders immediately.
		 */
		activateDeferredStyle() {
			const el = document.getElementById( 'test-router-deferred-style' );
			if ( el ) {
				el.media = 'all';
				state.deferredStyleStatus = 'active';
			}
		},

		/**
		 * SPA navigation action — intercepts the anchor click and delegates to
		 * the iAPI router's navigate() so the router performs a client-side
		 * navigation instead of a full page reload.
		 *
		 * Without this, plain <a href="..."> links inside the router region
		 * would cause a full page reload, resetting all reactive state and
		 * making it impossible to verify that applyStyles() preserved the
		 * activated stylesheet across navigation.
		 *
		 * Uses a generator function to yield the dynamic import.
		 * actions.navigate() is called without yield (fire-and-forget),
		 * matching the pattern used in full-page.ts.
		 *
		 * @param {MouseEvent} event The click event from data-wp-on--click.
		 */
		*navigate( event ) {
			event.preventDefault();
			const { ref } = getElement();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			actions.navigate( ref.href );
		},
	},

	callbacks: {
		/**
		 * Runs on every SPA page mount (data-wp-init).
		 *
		 * Execution order per navigation:
		 *   1. applyStyles()  — router enables / disables sheets.
		 *   2. iAPI re-initialises directives, calling this callback.
		 *
		 * Reading the DOM here therefore always reflects the post-applyStyles
		 * state, allowing both signals to be synchronised accurately.
		 *
		 * Bug B: injects the plugin-style element on first mount; subsequent
		 *   mounts confirm it survived applyStyles() without being disabled.
		 *
		 * Bug A: re-reads sheet.disabled so deferredStyleStatus reflects whether
		 *   applyStyles() correctly preserved the activated sheet.
		 */
		init() {
			// Bug B — idempotent plugin-style injection.
			if ( ! document.getElementById( PLUGIN_STYLE_ID ) ) {
				const style = document.createElement( 'style' );
				style.id = PLUGIN_STYLE_ID;
				style.textContent = 'body { --test-plugin-style: 1; }';
				document.head.appendChild( style );
			}
			state.pluginStyleStatus = 'active';

			// Bug A — re-sync deferred status after applyStyles().
			const el = document.getElementById( 'test-router-deferred-style' );
			state.deferredStyleStatus =
				el?.sheet && ! el.sheet.disabled && el.media !== 'not all'
					? 'active'
					: 'inactive';
		},
	},
} );
