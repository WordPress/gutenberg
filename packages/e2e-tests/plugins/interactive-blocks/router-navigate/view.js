/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

const { state } = store( 'router', {
	state: {
		status: 'idle',
		navigations: 0,
		timeout: 10000,
	},
	actions: {
		*navigate( e ) {
			e.preventDefault();

			state.navigations += 1;
			state.status = 'busy';

			const force = e.target.dataset.forceNavigation === 'true';
			const { timeout } = state;

			const { actions } = yield import(
				"@wordpress/interactivity-router"
			);
			yield actions.navigate( e.target.href, { force, timeout } );

			state.navigations -= 1;

			if ( state.navigations === 0 ) {
				state.status = 'idle';
			}
		},
		toggleTimeout() {
			state.timeout = state.timeout === 10000 ? 0 : 10000;
		},
	},
} );
