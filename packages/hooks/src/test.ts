/**
 * WordPress dependencies
 */
import { createReduxStore, doSelect } from '@wordpress/data';

const store = createReduxStore( 'test', {
	initialState: {},
	reducer: () => {},
	actions: {},
	selectors: {
		getTest( state: any, idx: number ) {
			return state ? idx : idx;
		},
	},
} );

export const values = doSelect( ( select ) => {
	const s = select( store );
	return s.getTest( 12 );
} );
