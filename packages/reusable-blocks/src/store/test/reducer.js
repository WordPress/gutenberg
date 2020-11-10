/**
 * Internal dependencies
 */
import { isEditingReusableBlock } from '../reducer';

describe( 'isEditingReusableBlock', () => {
	it( 'should initialize empty state when there is no original state', () => {
		expect( isEditingReusableBlock() ).toEqual( {} );
	} );

	it( 'should set the value in state', () => {
		const originalState = {};
		const newState = isEditingReusableBlock( originalState, {
			type: 'SET_EDITING_REUSABLE_BLOCK',
			clientId: 1,
			isEditing: true,
		} );
		expect( newState ).not.toBe( originalState );
		expect( newState ).toEqual( {
			1: true,
		} );
	} );

	it( 'should replace the value in state', () => {
		const originalState = {
			1: false,
		};
		const newState = isEditingReusableBlock( originalState, {
			type: 'SET_EDITING_REUSABLE_BLOCK',
			clientId: 1,
			isEditing: true,
		} );
		expect( newState ).not.toBe( originalState );
		expect( newState ).toEqual( {
			1: true,
		} );
	} );
} );
