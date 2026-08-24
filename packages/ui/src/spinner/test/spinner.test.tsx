import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Spinner } from '../index';

describe( 'Spinner', () => {
	it( 'forwards ref', () => {
		const ref = createRef< SVGSVGElement >();

		render( <Spinner ref={ ref } data-testid="spinner" /> );

		expect( ref.current ).toBeInstanceOf( SVGSVGElement );
	} );

	it( 'forwards props to the rendered element', () => {
		render( <Spinner data-testid="spinner" aria-label="Loading" /> );

		expect( screen.getByTestId( 'spinner' ) ).toHaveAttribute(
			'aria-label',
			'Loading'
		);
	} );

	it( 'forwards the class name to the rendered element', () => {
		render( <Spinner data-testid="spinner" className="test-class" /> );

		expect( screen.getByTestId( 'spinner' ) ).toHaveClass( 'test-class' );
	} );
} );
