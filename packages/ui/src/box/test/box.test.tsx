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
import { Box } from '../box';

describe( 'Box', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <Box ref={ ref }>Content</Box> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'merges props', () => {
		render(
			<Box backgroundColor="brand" style={ { width: '10px' } }>
				Content
			</Box>
		);

		const box = screen.getByText( 'Content' );

		expect( box ).toHaveStyle( {
			'background-color':
				'var(--wpds-color-bg-surface-brand, var(--wpds-color-bg-surface-brand))',
			width: '10px',
		} );
	} );
} );
