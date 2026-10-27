/**
 * WordPress dependencies
 */
import { store, getElement, withSyncEvent } from '@wordpress/interactivity';

const { state } = store( 'test/router-styles', {
	state: {
		clientSideNavigation: false,
		prefetching: false,
		hydrated: false,
	},
	actions: {
		navigate: withSyncEvent( function* ( e ) {
			e.preventDefault();
			state.clientSideNavigation = false;
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
			state.clientSideNavigation = true;
		} ),
		*prefetch() {
			state.prefetching = true;
			const { ref } = getElement();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.prefetch( ref.href );
			state.prefetching = false;
		},
	},
	callbacks: {
		setHydrated() {
			state.hydrated = true;
		},
	},
} );
