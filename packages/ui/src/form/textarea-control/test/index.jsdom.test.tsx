import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { TextareaControl } from '../index';

describe( 'TextareaControl', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLTextAreaElement >();

		render( <TextareaControl ref={ ref } label="Comment" /> );

		expect( ref.current ).toBeInstanceOf( HTMLTextAreaElement );
	} );

	it( 'renders with a visible label', () => {
		render( <TextareaControl label="Comment" /> );

		expect(
			screen.getByRole( 'textbox', { name: 'Comment' } )
		).toBeVisible();
		expect( screen.getByText( 'Comment' ) ).toBeVisible();
	} );

	it( 'renders with a visually hidden label', () => {
		render( <TextareaControl label="Notes" hideLabelFromVision /> );

		expect(
			screen.getByRole( 'textbox', { name: 'Notes' } )
		).toBeInTheDocument();
	} );

	it( 'renders with a description', () => {
		render(
			<TextareaControl
				label="Comment"
				description="Please provide your feedback."
			/>
		);

		expect(
			screen.getByRole( 'textbox', {
				name: 'Comment',
				description: 'Please provide your feedback.',
			} )
		).toBeVisible();
	} );

	it( 'renders with details', () => {
		render(
			<TextareaControl
				label="Bio"
				details={
					<span>
						Learn more in the <a href="#help">help guide</a>
					</span>
				}
			/>
		);

		expect( screen.getByText( /Learn more in the/ ) ).toBeVisible();
	} );
} );
