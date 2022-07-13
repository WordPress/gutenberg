/**
 * Internal dependencies
 */
import flow from '../flow';

describe( 'getLayoutStyle', () => {
	it( 'should return an empty string if no non-default params are provided', () => {
		const expected = '';

		const result = flow.getLayoutStyle( {
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
