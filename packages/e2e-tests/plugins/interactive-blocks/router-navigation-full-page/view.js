/**
 * WordPress dependencies
 */
import { store, withSyncEvent } from '@wordpress/interactivity';

/*
 * `core/router` is *read*, never imported -- same rationale as
 * `router-navigation-lifecycle/view.js`: this namespace is auto-created by
 * the store proxy and later merges into the router's own store once (and
 * if) that module loads.
 */
const { state: routerState } = store( 'core/router' );

/**
 * Renders a `navigating` value the same way as
 * `router-navigation-lifecycle/view.js`'s `describeNavigating`.
 *
 * @param {boolean|undefined} navigating
 * @return {string} The human-readable reading.
 */
function describeNavigating( navigating ) {
	return navigating ? 'navigating' : 'not navigating';
}

/**
 * Renders an `initiator` value the same way as
 * `router-navigation-lifecycle/view.js`'s `describeInitiator`. `undefined`
 * (never set) and `null` (no enclosing region, or explicitly suppressed) are
 * deliberately not distinguished here -- both are the documented "absence of
 * identity" reading (Requirement 11).
 *
 * @param {string|null|undefined} initiator
 * @return {string} The human-readable reading.
 */
function describeInitiator( initiator ) {
	return initiator === undefined || initiator === null ? 'absent' : initiator;
}

const { state } = store( 'router-navigation-full-page', {
	state: {
		/*
		 * The backing array lives inside `state`, not at module scope, for
		 * the same reason as `router-navigation-lifecycle/view.js`: a
		 * module-scope mutation is invisible to the signals system, so
		 * nothing would ever mark `state.log`'s `data-wp-text` readout dirty.
		 */
		_log: [],

		get navigatingReading() {
			return describeNavigating( routerState.navigating );
		},
		get initiatorReading() {
			return describeInitiator( routerState.initiator );
		},

		/*
		 * A serialized array, so a spec can `JSON.parse` the readout and
		 * assert on its *content*. This is the only instrument the full-page
		 * flows use for "a transition fired at all": the whole BODY is one
		 * router region in full-page mode, so this element -- and its
		 * `data-wp-watch` -- is torn down and re-created on every
		 * navigation, and its run *count* is therefore not a transition
		 * record. `state.log` itself is module state and survives the swap.
		 */
		get log() {
			return JSON.stringify( state._log );
		},
	},
	actions: {
		navigate: withSyncEvent( function* ( e ) {
			/*
			 * `e.preventDefault()` is not optional here either: without it,
			 * every click also performs a full page load, and the full-page
			 * document listener (`full-page.ts`) would also see the event,
			 * since it gates on `! event.defaultPrevented` -- which is the
			 * premise Flow 22 rests on.
			 */
			e.preventDefault();
			const { actions: router } = yield import(
				'@wordpress/interactivity-router'
			);
			yield router.navigate( e.target.href );
		} ),
	},
	callbacks: {
		/*
		 * The counted lifecycle observer, same shape as
		 * `router-navigation-lifecycle/view.js`'s `watchLifecycle`: reads
		 * *only* `routerState.navigating` and `routerState.initiator`, one
		 * entry per run.
		 */
		watchLifecycle() {
			state._log.push( {
				navigating: describeNavigating( routerState.navigating ),
				initiator: describeInitiator( routerState.initiator ),
			} );
		},
	},
} );
