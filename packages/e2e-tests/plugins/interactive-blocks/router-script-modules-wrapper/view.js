/**
 * WordPress dependencies
 */
import { store, getElement } from '@wordpress/interactivity';

const { state } = store( 'test/router-script-modules', {
	state: {
		clientSideNavigation: false,
		names: [],
	},
	actions: {
		*navigate( e ) {
			e.preventDefault();
			state.clientSideNavigation = false;
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
			state.clientSideNavigation = true;
		},
		*prefetch() {
			const { ref } = getElement();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.prefetch( ref.href );
		},
		pushName( name ) {
			state.names.push( name );
		},
	},
} );
