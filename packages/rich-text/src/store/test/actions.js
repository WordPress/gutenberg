/**
 * Internal dependencies
 */
import { addFormatTypes, removeFormatTypes } from '../actions';

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
} );
