/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity/store';
import init from '../utils/interactivity';

store( {
	effects: {
		alert: () => {
			// eslint-disable-next-line no-console
			console.log( 'image hydrated!' );
		},
	},
} );

init();
