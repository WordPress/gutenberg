/**
 * WordPress dependencies
 */
import {
	store,
	getServerState,
	getContext,
	withSyncEvent,
} from '@wordpress/interactivity';

const { state } = store( 'test/get-server-state', {
	actions: {
		navigate: withSyncEvent( function* ( e ) {
			e.preventDefault();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
		} ),
		attemptModification() {
			try {
				getServerState().prop = 'updated from client';
				getContext().result = 'unexpectedly modified ❌';
			} catch ( e ) {
				getContext().result = 'not modified ✅';
			}
		},
		updateNonChanging() {
			state.nonChanging = 'modified from client';
		},
	},
	callbacks: {
		updateState() {
			const { prop, newProp, nested } = getServerState();
			state.prop = prop;
			state.nested.prop = nested?.prop;
			if ( newProp ) {
				state.newProp = newProp;
			}
			if ( nested.newProp ) {
				state.nested.newProp = nested?.newProp;
			}
		},
		updateNonChanging() {
			// This property never changes in the server, but it changes in the
			// client so every time there's a navigation, we need to overwrite
			// it.
			const { nonChanging } = getServerState();
			state.nonChanging = nonChanging;
		},
		updateOnlyInMain() {
			// This property only exists in the main link, so we need to clear
			// it when navigating to a page that doesn't have it.
			const { onlyInMain } = getServerState();
			state.onlyInMain = onlyInMain;
		},
		updateOnlyInLink1() {
			// This property only exists in link 1, so we need to clear it when
			// navigating to a page that doesn't have it.
			const { onlyInLink1 } = getServerState();
			state.onlyInLink1 = onlyInLink1;
		},
	},
} );
