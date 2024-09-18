/**
 * WordPress dependencies
 */
import { store, getServerContext } from '@wordpress/interactivity';

const { state } = store( 'test/get-server-state', {
	actions: {
		*navigate( e ) {
			e.preventDefault();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
		},
		tryToUpdateServerState() {
			getServerContext().prop = 'updated from client';
		},
	},
	callbacks: {
		updateState() {
			const { prop, newProp, nested } = getServerContext();
			state.prop = prop;
			state.newProp = newProp;
			state.nested.prop = nested.prop;
			state.nested.newProp = nested.newProp;
		},
	},
} );
