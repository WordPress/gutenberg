/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Stack, getNormalizedGap } from '../stack';

describe( 'getNormalizedGap', () => {
	it( 'should return the gap as a CSS calculation when the gap is a positive number', () => {
		const result = getNormalizedGap( 1 );

		expect( result ).toBe( 'calc( 1 * var( --wpds-dimension-base ) )' );
	} );

	it( 'should return the CSS variable reference to a token value', () => {
		const result = getNormalizedGap( 'md' );

		expect( result ).toBe( 'var(--wpds-dimension-gap-md)' );
	} );

	it( 'should return the gap as a literal value when the gap is a string', () => {
		const result = getNormalizedGap( '10px' );

		expect( result ).toBe( '10px' );
	} );
} );

describe( 'Stack', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <Stack ref={ ref }>Content</Stack> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );
} );
