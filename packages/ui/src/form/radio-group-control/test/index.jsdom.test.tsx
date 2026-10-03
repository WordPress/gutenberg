import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroupControl } from '../index';

globalThis.wpVitest.mockPointerEvent();

describe( 'RadioGroupControl', () => {
	const defaultItems = [
		{ label: 'Option A', value: 'a' },
		{ label: 'Option B', value: 'b' },
		{ label: 'Option C', value: 'c' },
	];

	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render(
			<RadioGroupControl
				ref={ ref }
				label="Choose an option"
				items={ defaultItems }
			/>
		);

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'renders accessible radiogroup with label and description', () => {
		render(
			<RadioGroupControl
				label="Choose an option"
				description="Select one of the available options"
				items={ defaultItems }
			/>
		);

		expect(
			screen.getByRole( 'radiogroup', {
				name: 'Choose an option',
				description: 'Select one of the available options',
			} )
		).toBeVisible();
		expect(
			screen.queryByRole( 'group', { name: 'Choose an option' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders item descriptions when provided', () => {
		render(
			<RadioGroupControl
				label="Choose an option"
				items={ [
					{
						label: 'Option A',
						value: 'a',
						description: 'First option',
					},
				] }
			/>
		);

		expect(
			screen.getByRole( 'radio', {
				name: 'Option A',
				description: 'First option',
			} )
		).toBeVisible();
	} );

	it( 'renders with a visually hidden label', () => {
		render(
			<RadioGroupControl
				label="Choose an option"
				hideLabelFromVision
				items={ defaultItems }
			/>
		);

		expect(
			screen.getByRole( 'radiogroup', { name: 'Choose an option' } )
		).toBeVisible();
	} );

	it( 'renders with details', () => {
		render(
			<RadioGroupControl
				label="Choose an option"
				items={ defaultItems }
				details={
					<span>
						Read the <a href="#help">help</a>
					</span>
				}
			/>
		);

		expect( screen.getByText( /Read the/ ) ).toBeVisible();
	} );

	it( 'handles disabled items correctly', () => {
		render(
			<RadioGroupControl
				label="Choose an option"
				items={ [ { label: 'Option A', value: 'a', disabled: true } ] }
			/>
		);

		expect(
			screen.getByRole( 'radio', { name: 'Option A' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'selects when the label is clicked', async () => {
		const user = userEvent.setup();

		render(
			<RadioGroupControl
				label="Choose an option"
				items={ defaultItems }
			/>
		);

		const radio = screen.getByRole( 'radio', { name: 'Option B' } );
		expect( radio ).not.toBeChecked();

		await user.click( screen.getByText( 'Option B' ) );

		expect( radio ).toBeChecked();
	} );

	describe( 'Form data behavior', () => {
		it( 'submits correct form data when a radio is selected', async () => {
			const user = userEvent.setup();
			const handleSubmit = vi.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<RadioGroupControl
						label="Choose an option"
						name="choice"
						items={ defaultItems }
					/>
					<button type="submit">Submit</button>
				</form>
			);

			const radioB = screen.getByRole( 'radio', { name: 'Option B' } );

			await user.click( radioB );
			expect( radioB ).toBeChecked();

			await user.click(
				screen.getByRole( 'button', {
					name: 'Submit',
				} )
			);

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'choice' ) ).toBe( 'b' );
		} );

		it( 'matches native radio group behavior when no item is selected', async () => {
			const user = userEvent.setup();
			const handleSubmit = vi.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<fieldset>
						<legend>Native Choice</legend>
						<input
							type="radio"
							id="native-a"
							name="native-choice"
							value="a"
						/>
						<label htmlFor="native-a">Native Option A</label>
						<input
							type="radio"
							id="native-b"
							name="native-choice"
							value="b"
						/>
						<label htmlFor="native-b">Native Option B</label>
					</fieldset>

					<RadioGroupControl
						label="Custom Choice"
						name="custom-choice"
						items={ [
							{ label: 'Custom Option A', value: 'a' },
							{ label: 'Custom Option B', value: 'b' },
						] }
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

			expect( formData.get( 'custom-choice' ) ).toStrictEqual(
				formData.get( 'native-choice' )
			);
		} );
	} );
} );
