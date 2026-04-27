/**
 * Internal dependencies
 */
import {
	addFormatTypes,
	removeFormatTypes,
	disableFormatTypeInBlock,
	enableFormatTypeInBlock,
} from '../actions';

describe( 'actions', () => {
	describe( 'addFormatTypes', () => {
		it( 'should cast format types as an array', () => {
			const formatTypes = { name: 'core/test-format' };
			const expected = {
				type: 'ADD_FORMAT_TYPES',
				formatTypes: [ formatTypes ],
			};

			expect( addFormatTypes( formatTypes ) ).toEqual( expected );
		} );
	} );

	describe( 'removeFormatTypes', () => {
		it( 'should cast format types as an array', () => {
			const names = 'core/test-format';
			const expected = {
				type: 'REMOVE_FORMAT_TYPES',
				names: [ names ],
			};

			expect( removeFormatTypes( names ) ).toEqual( expected );
		} );
	} );

	describe( 'disableFormatTypeInBlock', () => {
		it( 'should return the correct action object', () => {
			expect(
				disableFormatTypeInBlock( 'core/heading', 'core/italic' )
			).toEqual( {
				type: 'DISABLE_FORMAT_TYPE_IN_BLOCK',
				blockName: 'core/heading',
				formatName: 'core/italic',
			} );
		} );
	} );

	describe( 'enableFormatTypeInBlock', () => {
		it( 'should return the correct action object', () => {
			expect(
				enableFormatTypeInBlock( 'core/heading', 'core/italic' )
			).toEqual( {
				type: 'ENABLE_FORMAT_TYPE_IN_BLOCK',
				blockName: 'core/heading',
				formatName: 'core/italic',
			} );
		} );
	} );
} );
