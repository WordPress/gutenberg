/**
 * Internal dependencies
 */
import { store } from '@wordpress/interactivity';

const PLUGIN_STYLE_ID = 'test-router-plugin-style';

/**
 * Access the router's reactive state so our computed getters re-evaluate
 * automatically after every SPA navigation.
 *
 * `routerState.url` is updated inside the same `batch()` that calls
 * `renderPage()`. Because `applyStyles()` runs before that batch flushes,
 * any getter that reads `routerState.url` will observe the post-applyStyles
 * DOM state when it is re-evaluated.
 */
const { state: routerState } = store( 'core/router', {} );

const { state } = store( 'test/router-dynamic-styles', {
	state: {
		/**
		 * Internal toggle flipped by activateDeferredStyle(). Forces the
		 * deferredStyleStatus getter to re-evaluate on click, since clicking
		 * does not change routerState.url.
		 *
		 * @type {boolean}
		 */
		_deferredActivated: false,

		/**
		 * Internal flag set by init() after the plugin style is injected.
		 * Forces pluginStyleStatus to re-evaluate after the element appears,
		 * since injection does not change routerState.url.
		 *
		 * @type {boolean}
		 */
		_pluginStyleInjected: false,

		/**
		 * "active" | "inactive". Computed getter that reads the real DOM on
		 * every SPA navigation (via routerState.url) and on every click of
		 * "activate-deferred-style" (via state._deferredActivated).
		 *
		 * Reading routerState.url establishes a Preact signal dependency: the
		 * router sets url inside the same batch as applyStyles(), so when the
		 * signal fires the DOM already reflects the post-applyStyles state.
		 *
		 * @return {"active"|"inactive"} Whether the deferred stylesheet is active.
		 */
		get deferredStyleStatus() {
			// Establish reactive dependencies so getter re-runs on nav + click.
			void routerState.url;
			void state._deferredActivated;

			const el = document.getElementById(
				'test-router-deferred-style'
			);
			return el?.sheet && ! el.sheet.disabled && el.media !== 'not all'
				? 'active'
				: 'inactive';
		},

		/**
		 * "active" | "inactive". Computed getter that reads the real DOM on
		 * every SPA navigation (via routerState.url) and after init() injects
		 * the element (via state._pluginStyleInjected).
		 *
		 * @return {"active"|"inactive"} Whether the plugin stylesheet is present.
		 */
		get pluginStyleStatus() {
			// Establish reactive dependencies.
			void routerState.url;
			void state._pluginStyleInjected;

			const el = document.getElementById( PLUGIN_STYLE_ID );
			return el?.sheet && ! el.sheet.disabled ? 'active' : 'inactive';
		},
	},

	actions: {
		/**
		 * Bug A fixture — activates the deferred stylesheet.
		 *
		 * Sets element.media from "not all" to "all", then toggles
		 * state._deferredActivated so the deferredStyleStatus getter
		 * re-evaluates and the span re-renders immediately.
		 */
		activateDeferredStyle() {
			const el = document.getElementById(
				'test-router-deferred-style'
			);
			if ( el ) {
				el.media = 'all';
				state._deferredActivated = ! state._deferredActivated;
			}
		},
	},

	callbacks: {
		/**
		 * Runs once on initial mount (data-wp-init = useEffect([], [])).
		 *
		 * Bug B: injects the plugin-style element idempotently, then sets
		 *   state._pluginStyleInjected = true so pluginStyleStatus
		 *   re-evaluates and the span re-renders immediately.
		 *
		 * deferredStyleStatus is handled entirely by the computed getter —
		 * no DOM sync needed here.
		 */
		init() {
			if ( ! document.getElementById( PLUGIN_STYLE_ID ) ) {
				const style = document.createElement( 'style' );
				style.id = PLUGIN_STYLE_ID;
				style.textContent = 'body { --test-plugin-style: 1; }';
				document.head.appendChild( style );
			}
			state._pluginStyleInjected = true;
		},
	},
} );
