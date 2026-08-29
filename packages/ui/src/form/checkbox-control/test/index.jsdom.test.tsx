import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { CheckboxControl } from '../index';

describe( 'CheckboxControl', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <CheckboxControl ref={ ref } label="Subscribe" /> );

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'renders with a visible label', () => {
		render( <CheckboxControl label="Subscribe" /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'Subscribe' } )
		).toBeVisible();
		expect( screen.getByText( 'Subscribe' ) ).toBeVisible();
	} );

	it( 'renders with a visually hidden label', () => {
		render( <CheckboxControl label="Subscribe" hideLabelFromVision /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'Subscribe' } )
		).toBeVisible();
	} );

	it( 'renders accessible label and description', () => {
		render(
			<CheckboxControl
				label="Newsletter"
				description="Subscribe to our newsletter"
			/>
		);

		expect(
			screen.getByRole( 'checkbox', {
				name: 'Newsletter',
				description: 'Subscribe to our newsletter',
			} )
		).toBeVisible();
	} );

	it( 'renders with details', () => {
		render(
			<CheckboxControl
				label="Terms"
				details={
					<span>
						Read the <a href="#terms">terms</a>
					</span>
				}
			/>
		);

		expect( screen.getByText( /Read the/ ) ).toBeVisible();
	} );

	it( 'toggles when the label is clicked', async () => {
		const user = userEvent.setup();

		render( <CheckboxControl label="Subscribe" /> );

		const checkbox = screen.getByRole( 'checkbox', { name: 'Subscribe' } );
		expect( checkbox ).not.toBeChecked();

		await user.click( screen.getByText( 'Subscribe' ) );

		expect( checkbox ).toBeChecked();
	} );

	describe( 'Form data behavior', () => {
		it( 'submits correct form data when checked with custom name and value', async () => {
			const user = userEvent.setup();
			const handleSubmit = jest.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<CheckboxControl
						label="Subscribe to newsletter"
						name="newsletter"
						value="yes"
					/>
					<button type="submit">Submit</button>
				</form>
			);

			const checkbox = screen.getByRole( 'checkbox', {
				name: 'Subscribe to newsletter',
			} );
			const submitButton = screen.getByRole( 'button', {
				name: 'Submit',
			} );

			await user.click( checkbox );
			expect( checkbox ).toBeChecked();

			await user.click( submitButton );

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'newsletter' ) ).toBe( 'yes' );
		} );

		it( 'does not include unchecked checkbox in form data', async () => {
			const user = userEvent.setup();
			const handleSubmit = jest.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<CheckboxControl
						label="Subscribe to newsletter"
						name="newsletter"
						value="yes"
					/>
					<button type="submit">Submit</button>
				</form>
			);

			const submitButton = screen.getByRole( 'button', {
				name: 'Submit',
			} );

			await user.click( submitButton );

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'newsletter' ) ).toBeNull();
		} );

		it( 'uses "on" as default value when no value prop is provided', async () => {
			const user = userEvent.setup();
			const handleSubmit = jest.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<CheckboxControl label="Enable feature" name="feature" />
					<button type="submit">Submit</button>
				</form>
			);

			const checkbox = screen.getByRole( 'checkbox', {
				name: 'Enable feature',
			} );
			const submitButton = screen.getByRole( 'button', {
				name: 'Submit',
			} );

			await user.click( checkbox );
			expect( checkbox ).toBeChecked();

			await user.click( submitButton );

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'feature' ) ).toBe( 'on' );
		} );

		it( 'handles multiple checkboxes with same name correctly', async () => {
			const user = userEvent.setup();
			const handleSubmit = jest.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<CheckboxControl
						label="Option A"
						name="options"
						value="a"
					/>
					<CheckboxControl
						label="Option B"
						name="options"
						value="b"
					/>
					<CheckboxControl
						label="Option C"
						name="options"
						value="c"
					/>
					<button type="submit">Submit</button>
				</form>
			);

			const checkboxA = screen.getByRole( 'checkbox', {
				name: 'Option A',
			} );
			const checkboxC = screen.getByRole( 'checkbox', {
				name: 'Option C',
			} );
			const submitButton = screen.getByRole( 'button', {
				name: 'Submit',
			} );

			await user.click( checkboxA );
			await user.click( checkboxC );

			expect( checkboxA ).toBeChecked();
			expect( checkboxC ).toBeChecked();

			await user.click( submitButton );

			const formData = handleSubmit.mock.results[ 0 ].value;

			const allOptions = formData.getAll( 'options' );
			expect( allOptions ).toEqual( [ 'a', 'c' ] );
		} );
	} );
} );
