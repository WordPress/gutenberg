/**
 * WordPress dependencies
 */
import {
	createReduxStore,
	doSelect,
	doDispatch,
	ThunkOf,
} from '@wordpress/data';

const store = createReduxStore( 'test', {
	initialState: {},
	reducer: () => {},
	actions: {
		dispatchStuff: ( stuff = 1 ) => ( { type: 'STUFF', stuff } ),
	},
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
	return { test: s.getTest( 12 ), test2: s2.getTestFromStore2( 12 ) };
} );

const { dispatchStuff } = doDispatch( store );
const result = dispatchStuff( 12 );

export const setTemperature: ThunkOf< typeof store > = () => ( {
	dispatch,
	select,
} ) => {
	dispatch.dispatchStuff( 1 );
	const is2 = select( () => 2 );
	return 1 + is2;
};
