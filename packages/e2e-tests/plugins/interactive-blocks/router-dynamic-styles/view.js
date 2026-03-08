/**
 * Internal dependencies
 */
import { store } from '@wordpress/interactivity';

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
