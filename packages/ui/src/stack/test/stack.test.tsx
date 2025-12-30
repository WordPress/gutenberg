/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Stack } from '../stack';

describe( 'Stack', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <Stack ref={ ref }>Content</Stack> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'merges props', () => {
		render(
			<Stack className="example-class" style={ { width: '10px' } }>
				Content
			</Stack>
		);

		const box = screen.getByText( 'Content' );

		expect( box ).toHaveStyle( { width: '10px' } );
		expect( box ).toHaveClass( 'example-class' );
	} );
} );
