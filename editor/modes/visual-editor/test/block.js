/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { getBlockAttributesAsProps } from '../block';

describe( 'block', () => {
	describe( 'getBlockAttributesAsProps()', () => {
		it( 'should return an object of data-* attribute props', () => {
			const props = getBlockAttributesAsProps( {
				string: 'string',
				number: 10,
				bool: true,
				object: {},
				array: [],
				undef: undefined
			} );

			expect( props ).to.eql( {
				'data-string': 'string',
				'data-number': '10',
				'data-bool': 'true'
			} );
		} );
	} );
} );
