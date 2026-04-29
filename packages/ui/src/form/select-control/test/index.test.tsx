import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { SelectControl } from '../index';

describe( 'SelectControl', () => {
	const mockItems = [
		{ value: '', label: 'Select' },
		{ value: 'option1', label: 'Option 1' },
		{ value: 'option2', label: 'Option 2' },
		{ value: 'option3', label: 'Option 3' },
	];

	it( 'forwards ref', () => {
		const ref = createRef< HTMLInputElement >();

		render(
			<SelectControl
				ref={ ref }
				label="Select an option"
				items={ mockItems }
			/>
		);

		expect( ref.current ).toBeInstanceOf( HTMLInputElement );
	} );

	it( 'renders accessible label and description', () => {
		render(
			<SelectControl
				label="Country"
				description="Choose your country"
				items={ mockItems }
			/>
		);

		expect(
			screen.getByRole( 'combobox', {
				name: 'Country',
				description: 'Choose your country',
			} )
		).toBeVisible();
	} );

	it( 'renders with a visually hidden label', () => {
		render(
			<SelectControl
				label="Country"
				hideLabelFromVision
				items={ mockItems }
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Country' } )
		).toBeVisible();
	} );

	it( 'renders with details', () => {
		render(
			<SelectControl
				label="Country"
				items={ mockItems }
				details={
					<span>
						Select the country where your store is registered.
					</span>
				}
			/>
		);

		expect(
			screen.getByText( /where your store is registered/ )
		).toBeVisible();
	} );

	describe( 'Form data behavior', () => {
		it( 'submits correct form data when option is selected with custom name', async () => {
			const user = userEvent.setup();
			const handleSubmit = jest.fn(
				( event: React.FormEvent< HTMLFormElement > ) => {
					event.preventDefault();
					return new FormData( event.currentTarget );
				}
			);

			render(
				<form onSubmit={ handleSubmit }>
					<SelectControl
						label="Country"
						name="country"
						items={ mockItems }
					/>
					<button type="submit">Submit</button>
				</form>
			);

			await user.click(
				screen.getByRole( 'combobox', {
					name: 'Country',
				} )
			);

			const optionToSelect = await screen.findByRole( 'option', {
				name: /Option 2/i,
			} );
			await user.click( optionToSelect );

			await user.click(
				screen.getByRole( 'button', {
					name: 'Submit',
				} )
			);

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'country' ) ).toBe( 'option2' );
		} );

		it( 'submits form data with default value when no selection is made', async () => {
			const user = userEvent.setup();
			const handleSubmit = jest.fn(
				( event: React.FormEvent< HTMLFormElement > ) => {
					event.preventDefault();
					return new FormData( event.currentTarget );
				}
			);

			render(
				<form onSubmit={ handleSubmit }>
					<SelectControl
						label="Country"
						name="country"
						items={ mockItems }
						defaultValue=""
					/>
					<button type="submit">Submit</button>
				</form>
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Submit',
				} )
			);

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'country' ) ).toBe( '' );
		} );
	} );
} );
