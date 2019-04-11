/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { getFormatTypes, getFormatType } from '../selectors';

describe( 'selectors', () => {
	const defaultState = deepFreeze( {
		formatTypes: {
			'core/test-format': { name: 'core/test-format' },
			'core/test-format-2': { name: 'core/test-format-2' },
		},
	} );

	describe( 'getFormatTypes', () => {
		it( 'should get format types', () => {
			const expected = [
				{ name: 'core/test-format' },
				{ name: 'core/test-format-2' },
			];

			expect( getFormatTypes( defaultState ) ).toEqual( expected );
		} );
	} );

	describe( 'getFormatType', () => {
		it( 'should get a format type', () => {
			const expected = { name: 'core/test-format' };
			const result = getFormatType( defaultState, 'core/test-format' );

			expect( result ).toEqual( expected );
		} );
	} );
} );
