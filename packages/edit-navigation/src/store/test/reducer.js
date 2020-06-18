/**
 * Internal dependencies
 */
import { mapping } from '../reducer';

describe( 'mapping', () => {
	it( 'should initialize empty mapping when there is no original state', () => {
		expect( mapping( null, {} ) ).toEqual( {} );
	} );

	it( 'should add the mapping to state', () => {
		const originalState = {};
		const newState = mapping( originalState, {
			type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: 1,
			mapping: { a: 'b' },
		} );
		expect( newState ).not.toBe( originalState );
		expect( newState ).toEqual( {
			1: {
				a: 'b',
			},
		} );
	} );

	it( 'should replace the mapping in state', () => {
		const originalState = {
			1: {
				c: 'd',
			},
			2: {
				e: 'f',
			},
		};
		const newState = mapping( originalState, {
			type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
			postId: 1,
			mapping: { g: 'h' },
		} );
		expect( newState ).toEqual( {
			1: {
				g: 'h',
			},
			2: {
				e: 'f',
			},
		} );
	} );
} );

