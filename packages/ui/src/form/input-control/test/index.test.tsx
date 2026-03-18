import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { InputControl } from '../index';

describe( 'InputControl', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLInputElement >();

		render( <InputControl ref={ ref } label="Username" /> );

		expect( ref.current ).toBeInstanceOf( HTMLInputElement );
	} );

	it( 'renders with a visible label', () => {
		render( <InputControl label="Email" /> );

		expect(
			screen.getByRole( 'textbox', { name: 'Email' } )
		).toBeVisible();
		expect( screen.getByText( 'Email' ) ).toBeVisible();
	} );

	it( 'renders with a visually hidden label', () => {
		const { container } = render(
			<InputControl label="Search" hideLabelFromVision />
		);

		expect(
			screen.getByRole( 'textbox', { name: 'Search' } )
		).toBeVisible();
		// The label should still be in the DOM for accessibility,
		// but visually hidden via the VisuallyHidden component.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const label = container.querySelector( 'label' );
		expect( label ).toHaveTextContent( 'Search' );
	} );

	it( 'renders with a description', () => {
		render(
			<InputControl label="Name" description="Enter your full name." />
		);

		expect( screen.getByText( 'Enter your full name.' ) ).toBeVisible();
	} );

	it( 'renders with details', () => {
		render(
			<InputControl
				label="Website"
				details={
					<span>
						Must start with <code>https://</code>
					</span>
				}
			/>
		);

		expect( screen.getByText( /Must start with/ ) ).toBeVisible();
	} );
} );
