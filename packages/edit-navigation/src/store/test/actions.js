/**
 * Internal dependencies
 */
import { setSelectedMenuId } from '../actions';

jest.mock( '../utils', () => {
	const utils = jest.requireActual( '../utils' );
	// Mock serializeProcessing to always return the callback for easier testing and less boilerplate.
	utils.serializeProcessing = ( callback ) => callback;
	return utils;
} );

describe( 'setSelectedMenuId', () => {
	it( 'should return the SET_SELECTED_MENU_ID action', () => {
		const menuId = 1;
		expect( setSelectedMenuId( menuId ) ).toEqual( {
			type: 'SET_SELECTED_MENU_ID',
			menuId,
		} );
	} );
} );
