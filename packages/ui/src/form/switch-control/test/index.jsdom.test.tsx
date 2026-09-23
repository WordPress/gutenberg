import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { describe, expect, it, vi } from 'vitest';
import { SwitchControl } from '../index';

globalThis.wpVitest.mockPointerEvent();

describe( 'SwitchControl', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <SwitchControl ref={ ref } label="Enable updates" /> );

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'renders with a visible label', () => {
		render( <SwitchControl label="Enable updates" /> );

		expect(
			screen.getByRole( 'switch', { name: 'Enable updates' } )
		).toBeVisible();
		expect( screen.getByText( 'Enable updates' ) ).toBeVisible();
	} );

	it( 'renders with a visually hidden label', () => {
		render( <SwitchControl label="Enable updates" hideLabelFromVision /> );

		expect(
			screen.getByRole( 'switch', { name: 'Enable updates' } )
		).toBeVisible();
	} );

	it( 'renders accessible label and description', () => {
		render(
			<SwitchControl
				label="Enable updates"
				description="Receive email updates"
			/>
		);

		expect(
			screen.getByRole( 'switch', {
				name: 'Enable updates',
				description: 'Receive email updates',
			} )
		).toBeVisible();
	} );

	it( 'renders with details', () => {
		render(
			<SwitchControl
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

		render( <SwitchControl label="Enable updates" /> );

		const control = screen.getByRole( 'switch', {
			name: 'Enable updates',
		} );
		expect( control ).not.toBeChecked();

		await user.click( screen.getByText( 'Enable updates' ) );

		expect( control ).toBeChecked();
	} );

	describe( 'Form data behavior', () => {
		it( 'submits correct form data when checked with custom name and value', async () => {
			const user = userEvent.setup();
			const handleSubmit = vi.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<SwitchControl
						label="Enable notifications"
						name="notifications"
						value="yes"
					/>
					<button type="submit">Submit</button>
				</form>
			);

			const control = screen.getByRole( 'switch', {
				name: 'Enable notifications',
			} );
			const submitButton = screen.getByRole( 'button', {
				name: 'Submit',
			} );

			await user.click( control );
			expect( control ).toBeChecked();

			await user.click( submitButton );

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'notifications' ) ).toBe( 'yes' );
		} );

		it( 'does not include an unchecked switch in form data', async () => {
			const user = userEvent.setup();
			const handleSubmit = vi.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<SwitchControl
						label="Enable notifications"
						name="notifications"
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
			expect( formData.get( 'notifications' ) ).toBeNull();
		} );

		it( 'uses "on" as default value when no value prop is provided', async () => {
			const user = userEvent.setup();
			const handleSubmit = vi.fn( ( event ) => {
				event.preventDefault();
				return new FormData( event.currentTarget );
			} );

			render(
				<form onSubmit={ handleSubmit }>
					<SwitchControl label="Enable feature" name="feature" />
					<button type="submit">Submit</button>
				</form>
			);

			const control = screen.getByRole( 'switch', {
				name: 'Enable feature',
			} );
			const submitButton = screen.getByRole( 'button', {
				name: 'Submit',
			} );

			await user.click( control );
			expect( control ).toBeChecked();

			await user.click( submitButton );

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'feature' ) ).toBe( 'on' );
		} );
	} );
} );
