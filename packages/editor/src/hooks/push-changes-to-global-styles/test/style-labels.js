/**
 * External dependencies
 */
import { capitalCase } from 'change-case';

/**
 * Internal dependencies
 */
import { getStyleLabel, STYLE_LABELS } from '../style-labels';

describe( 'getStyleLabel', () => {
	it( 'returns the authored label for a mapped path', () => {
		expect( getStyleLabel( [ 'color', 'background' ] ) ).toBe(
			STYLE_LABELS[ 'color.background' ]
		);
		expect( getStyleLabel( [ 'typography', 'textTransform' ] ) ).toBe(
			'Letter case'
		);
		expect( getStyleLabel( [ 'border', 'color' ] ) ).toBe( 'Border color' );
		expect( getStyleLabel( [ 'border' ] ) ).toBe( 'Border' );
		expect( getStyleLabel( [ 'border', 'left' ] ) ).toBe( 'Border left' );
	} );

	it( 'humanizes the last segment when the path is unmapped', () => {
		expect( getStyleLabel( [ 'some', 'unknownProperty' ] ) ).toBe(
			capitalCase( 'unknownProperty' )
		);
	} );

	it( 'returns an empty string for an empty path', () => {
		expect( getStyleLabel( [] ) ).toBe( '' );
	} );
} );
