/**
 * Internal dependencies
 */
import { store, init } from '../utils/interactivity';

store( {
	effects: {
		alert: ( { context } ) => {
			// eslint-disable-next-line no-console
			console.log( context.text );
		},
	},
} );

init();
