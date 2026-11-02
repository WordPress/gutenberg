import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Form } from '@base-ui/react/form';
import { Field as BaseField } from '@base-ui/react/field';
import * as Field from '../../field';
import { DateInput } from '../date-input';
import { DateInputControl } from '../../../date-input-control/date-input-control';

describe( 'DateInput browser integration', () => {
	it( 'keeps read-only segments focusable and unchanged', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		await render(
			<DateInputControl
				label="Date"
				defaultValue="2026-01-20"
				locale="en-US"
				readOnly
				onValueChange={ change }
			/>
		);
		await user.click( screen.getByText( 'Date' ) );
		expect( screen.getAllByRole( 'spinbutton' )[ 0 ] ).toHaveFocus();
		await user.keyboard( '{ArrowUp}{Backspace}25' );
		expect( change ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'spinbutton', { name: /month,/ } )
		).toHaveValue( '1' );
	} );

	it( 'blocks a required empty native form and focuses the first segment', async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		await render(
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					submit();
				} }
			>
				<DateInputControl
					label="Date"
					name="date"
					locale="en-US"
					required
				/>
				<button type="submit">Save</button>
			</form>
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).not.toHaveBeenCalled();
		expect( screen.getAllByRole( 'spinbutton' )[ 0 ] ).toHaveFocus();
	} );

	it( 'excludes a disabled native fieldset from submission and keyboard focus', async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		await render(
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					submit(
						Object.fromEntries(
							new FormData( event.currentTarget )
						)
					);
				} }
			>
				<fieldset disabled>
					<DateInputControl
						label="Date"
						name="date"
						defaultValue="2026-01-20"
						locale="en-US"
					/>
				</fieldset>
				<button type="submit">Save</button>
			</form>
		);
		await user.tab();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveFocus();
		await user.keyboard( '{Enter}' );
		expect( submit ).toHaveBeenCalledWith( {} );
	} );

	it( 'blocks submission after clearing a segment of a previously valid date', async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		await render(
			<Form onFormSubmit={ submit }>
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<DateInput defaultValue="2026-01-20" locale="en-US" />
				</Field.Root>
				<button type="submit">Save</button>
			</Form>
		);
		await user.click( screen.getByRole( 'spinbutton', { name: /day,/ } ) );
		await user.keyboard( '{Backspace}{Backspace}' );
		expect(
			screen.getByRole( 'spinbutton', { name: /day,/ } )
		).not.toHaveAttribute( 'aria-valuenow' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).not.toHaveBeenCalled();
		expect( screen.getAllByRole( 'spinbutton' )[ 0 ] ).toHaveFocus();
	} );

	it( 'blocks an impossible typed date instead of silently changing it on blur', async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		await render(
			<Form onFormSubmit={ submit }>
				<DateInputControl
					name="date"
					label="Date"
					defaultValue="2026-02-20"
					locale="en-US"
				/>
				<button type="submit">Save</button>
			</Form>
		);
		await user.click( screen.getByRole( 'spinbutton', { name: /day,/ } ) );
		await user.keyboard( '30' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'spinbutton', { name: /day,/ } )
		).toHaveValue( '30' );
		expect(
			screen.getByRole( 'spinbutton', { name: /year,/ } )
		).toHaveValue( '2026' );
		expect(
			screen.getByRole( 'spinbutton', { name: /day,/ } )
		).toHaveAttribute( 'aria-invalid', 'true' );
	} );

	it( 'exposes a server error on the editable segments', async () => {
		await render(
			<Form errors={ { date: 'This date is unavailable.' } }>
				<BaseField.Root name="date">
					<BaseField.Label>Date</BaseField.Label>
					<DateInput defaultValue="2026-01-20" locale="en-US" />
					<BaseField.Error />
				</BaseField.Root>
			</Form>
		);
		expect( screen.getByText( 'This date is unavailable.' ) ).toBeVisible();
		for ( const segment of screen.getAllByRole( 'spinbutton' ) ) {
			expect( segment ).toHaveAttribute( 'aria-invalid', 'true' );
			expect( segment ).toHaveAccessibleDescription(
				/This date is unavailable/
			);
		}
	} );

	it( 'submits canonical native form data independently of display locale', async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		await render(
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					submit(
						Object.fromEntries(
							new FormData( event.currentTarget )
						)
					);
				} }
			>
				<DateInputControl
					name="date"
					label="Date"
					defaultValue="2026-01-20"
					locale="ar-EG"
				/>
				<button type="submit">Save</button>
			</form>
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).toHaveBeenCalledWith( { date: '2026-01-20' } );
	} );

	it( 'runs Base UI blur validation after keyboard navigation out of the field', async () => {
		const user = userEvent.setup();
		const validate = vi.fn();
		await render(
			<>
				<BaseField.Root validate={ validate } validationMode="onBlur">
					<BaseField.Label>Date</BaseField.Label>
					<DateInput defaultValue="2026-01-20" locale="en-US" />
				</BaseField.Root>
				<button>Next</button>
			</>
		);
		await user.click( screen.getAllByRole( 'spinbutton' )[ 0 ] );
		await user.tab();
		await user.tab();
		await user.tab();
		expect( screen.getByRole( 'button', { name: 'Next' } ) ).toHaveFocus();
		expect( validate ).toHaveBeenCalledWith(
			'2026-01-20',
			expect.anything()
		);
	} );
} );
