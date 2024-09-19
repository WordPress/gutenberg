/**
 * WordPress dependencies
 */
import { store, getServerState, getContext } from '@wordpress/interactivity';

const { state } = store( 'test/get-server-state', {
	actions: {
		*navigate( e ) {
			e.preventDefault();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
		},
		attemptModification() {
			try {
				getServerState().prop = 'updated from client';
				getContext().result = 'unexpectedly modified ❌';
			} catch ( e ) {
				getContext().result = 'not modified ✅';
			}
		},
	},
	callbacks: {
		updateState() {
			const { prop, newProp, nested } = getServerState();
			state.prop = prop;
			state.newProp = newProp;
			state.nested.prop = nested.prop;
			state.nested.newProp = nested.newProp;
		},
	},
} );
