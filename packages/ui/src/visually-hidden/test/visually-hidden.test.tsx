import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { VisuallyHidden } from '../index';

describe( 'VisuallyHidden', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <VisuallyHidden ref={ ref }>Content</VisuallyHidden> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'should forward props to the rendered element', () => {
		render(
			<VisuallyHidden data-testid="visually-hidden">
				Content
			</VisuallyHidden>
		);

		expect( screen.getByTestId( 'visually-hidden' ) ).toBeInTheDocument();
	} );

	it( 'should forward the class name to the rendered element', () => {
		render(
			<VisuallyHidden
				data-testid="visually-hidden"
				className="test-class"
			>
				Content
			</VisuallyHidden>
		);

		expect( screen.getByTestId( 'visually-hidden' ) ).toHaveClass(
			'test-class'
		);
	} );
} );
