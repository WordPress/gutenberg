/**
 * Internal dependencies
 */
import { store } from '../utils/interactivity';

store( {
	actions: {
		core: {
			navigation: {
				openMenu: ( { context } ) => {
					context.open = true;
				},
			},
		},
	},
} );
