import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { logged } from '@wordpress/deprecated';
import { Surface } from '../index';

const DEPRECATION_MESSAGE =
	'wp.components.__experimentalSurface is deprecated since version 7.2 and will be removed in version 7.4.';

beforeEach( () => {
	logged[ DEPRECATION_MESSAGE ] = true;
} );

afterEach( () => {
	delete logged[ DEPRECATION_MESSAGE ];
} );

describe( 'Shows a deprecation warning', () => {
	test( 'Surface', () => {
		delete logged[ DEPRECATION_MESSAGE ];
		render( <Surface>Surface</Surface> );

		expect( console ).toHaveWarnedWith( DEPRECATION_MESSAGE );
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
