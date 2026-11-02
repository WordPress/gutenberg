import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRef } from '@wordpress/element';
import { DateInput } from '../date-input';

describe( 'single-text DateInput integration', () => {
	it( 'retains an impossible date, shows its error, and blocks Base UI submission', async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		render(
			<Form onFormSubmit={ submit }>
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<DateInput locale="sv-SE" defaultValue="2026-02-20" />
					<Field.Error />
				</Field.Root>
				<button type="submit">Save</button>
			</Form>
		);
		await user.clear( screen.getByRole( 'textbox', { name: 'Date' } ) );
		await user.type(
			screen.getByRole( 'textbox', { name: 'Date' } ),
			'2026-02-30'
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveValue(
			'2026-02-30'
		);
		expect(
			screen.getByText( 'Enter a valid date in YYYY-MM-DD format.' )
		).toBeVisible();
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveFocus();
	} );
	it( 'inherits its name, label, description, and partial-edit field state', async () => {
		const user = userEvent.setup();
		const ref = createRef< HTMLDivElement >();
		render(
			<>
				<Field.Root ref={ ref } name="date">
					<Field.Label>Date</Field.Label>
					<DateInput locale="sv-SE" />
					<Field.Description>
						Enter the subscription date.
					</Field.Description>
				</Field.Root>
				<button>Next</button>
			</>
		);
		const input = screen.getByRole( 'textbox', { name: 'Date' } );
		expect( input ).not.toHaveAttribute( 'name' );
		expect( input ).toHaveAccessibleDescription(
			'Enter the subscription date. Use YYYY-MM-DD, for example 2026-01-20.'
		);
		await user.click( screen.getByText( 'Date' ) );
		expect( input ).toHaveFocus();
		expect( ref.current ).toHaveAttribute( 'data-focused' );
		expect( ref.current ).not.toHaveAttribute( 'data-touched' );
		await user.type( input, '2026-' );
		expect( ref.current ).toHaveAttribute( 'data-dirty' );
		expect( ref.current ).toHaveAttribute( 'data-filled' );
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		expect( ref.current ).toHaveAttribute( 'data-touched' );
		expect( ref.current ).not.toHaveAttribute( 'data-focused' );
	} );
} );
