/**
 * WordPress dependencies
 */
import { createReduxStore, doSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

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

const store2 = createReduxStore( 'test', {
	initialState: {},
	reducer: () => {},
	actions: {},
	selectors: {
		getTestFromStore2( state: any, idx: number ) {
			return state ? idx : idx;
		},
	},
} );

export const values = doSelect( ( select ) => {
	const s = select( store );
	const s2 = select( store2 );
	const s3 = select( coreStore );
	return { test: s.getTest( 12 ), test2: s2.getTestFromStore2( 12 ) };
} );
