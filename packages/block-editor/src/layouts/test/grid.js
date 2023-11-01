/**
 * Internal dependencies
 */
import grid from '../grid';

describe( 'getLayoutStyle', () => {
	it( 'should return a single `grid-template-columns` property if no non-default params are provided', () => {
		const expected = `.editor-styles-wrapper .my-container { grid-template-columns: repeat(auto-fill, minmax(min(12rem, 100%), 1fr)); }`;

		const result = grid.getLayoutStyle( {
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
