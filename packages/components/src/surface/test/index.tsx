/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Surface } from '../index';

// Checking for deprecation warnings before other tests because the `deprecated`
// utility only fires a console.warn the first time a component is rendered.
describe( 'Shows a deprecation warning', () => {
	test( 'Surface', () => {
		render( <Surface>Surface</Surface> );

		expect( console ).toHaveWarnedWith(
			'wp.components.__experimentalSurface is deprecated since version 7.2 and will be removed in version 7.4.'
		);
	} );
} );

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
