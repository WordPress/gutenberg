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

	it( 'should support the render prop', () => {
		render(
			<>
				<VisuallyHidden
					render={
						// eslint-disable-next-line jsx-a11y/label-has-associated-control
						<label htmlFor="input-id" />
					}
				>
					My label
				</VisuallyHidden>
				{ /* eslint-disable-next-line no-restricted-syntax */ }
				<input id="input-id" />
			</>
		);

		expect(
			screen.getByRole( 'textbox', { name: 'My label' } )
		).toBeVisible();
	} );
} );
