/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Surface } from '../index';

describe( 'props', () => {
	test( 'should render children in a Surface wrapper', () => {
		render( <Surface>Surface</Surface> );

		const surface = screen.getByText( 'Surface' );

		expect( surface ).toHaveClass( 'components-surface' );
		expect( surface ).toHaveAttribute( 'data-wp-component', 'Surface' );
	} );

	test( 'should merge custom class names', () => {
		render( <Surface className="custom-surface">Surface</Surface> );

		expect( screen.getByText( 'Surface' ) ).toHaveClass(
			'components-surface',
			'custom-surface'
		);
	} );

	test( 'should render as the requested element', () => {
		render(
			<Surface as="section" aria-label="Surface area">
				Surface
			</Surface>
		);

		expect(
			screen.getByRole( 'region', { name: 'Surface area' } )
		).toHaveTextContent( 'Surface' );
	} );
} );
