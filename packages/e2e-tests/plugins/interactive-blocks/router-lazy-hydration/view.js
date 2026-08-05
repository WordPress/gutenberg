/**
 * WordPress dependencies
 */
import { store, withSyncEvent } from '@wordpress/interactivity';

const { state } = store( 'router-lazy-hydration', {
	state: {
		hydrated: 'yes',
		count: 0,
	},
	actions: {
		router: {
			// `withSyncEvent` is required so `event.preventDefault()` runs
			// synchronously — `wp-on` actions are async by default, and an
			// async `preventDefault()` lets the browser follow the link
			// before the router can intercept it (full page reload).
			navigate: withSyncEvent( function* ( e ) {
				e.preventDefault();
				const { actions } = yield import(
					'@wordpress/interactivity-router'
				);
				yield actions.navigate( e.target.href );
			} ),
			back: withSyncEvent( function* ( e ) {
				e.preventDefault();
				history.back();
			} ),
		},
		increment() {
			state.count += 1;
		},
	},
} );
