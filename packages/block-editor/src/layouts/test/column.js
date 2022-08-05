/**
 * Internal dependencies
 */
import column from '../column';

describe( 'getLayoutStyle', () => {
	it( 'should return an empty string if no non-default params are provided', () => {
		const expected = '';

		const result = column.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
} );
