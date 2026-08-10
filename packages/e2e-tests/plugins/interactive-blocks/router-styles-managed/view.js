import { store, withSyncEvent } from '@wordpress/interactivity';

const { state } = store( 'test/router-styles-managed', {
	state: {
		clientSideNavigation: false,
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
	},
	callbacks: {
		setHydrated() {
			state.hydrated = true;
		},
	},
} );
