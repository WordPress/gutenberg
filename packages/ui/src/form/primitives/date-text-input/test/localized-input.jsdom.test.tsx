import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { DateInput } from '../date-input';

const editor = () =>
	screen.getByRole< HTMLInputElement >( 'textbox', { name: 'Date' } );

describe( 'localized single-date prototype', () => {
	it( 'displays an ISO prop locally and submits exactly one ISO native form entry', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		render(
			<form>
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<DateInput
						locale="it-IT"
						defaultValue="2026-02-20"
						onValueChange={ change }
					/>
				</Field.Root>
			</form>
		);
		expect( editor() ).toHaveValue( '20/02/2026' );
		expect( new FormData( editor().form! ).getAll( 'date' ) ).toEqual( [
			'2026-02-20',
		] );
		await user.clear( editor() );
		await user.paste( '21/02/2026' );
		expect( change ).toHaveBeenLastCalledWith(
			'2026-02-21',
			expect.anything()
		);
		expect( editor() ).toHaveValue( '21/02/2026' );
		expect( new FormData( editor().form! ).getAll( 'date' ) ).toEqual( [
			'2026-02-21',
		] );
	} );
	it( 'clears the serialized date while retaining an invalid localized draft', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<DateInput
					locale="it-IT"
					aria-label="Date"
					name="date"
					defaultValue="2026-02-20"
				/>
			</form>
		);
		await user.click( editor() );
		await user.keyboard( '{End}{Backspace}' );
		expect( editor() ).toHaveValue( '20/02/202' );
		expect( editor().validity.valid ).toBe( false );
		expect( new FormData( editor().form! ).getAll( 'date' ) ).toEqual( [
			'',
		] );
	} );
	it( 'reformats the same ISO value when the display locale changes', () => {
		const view = render(
			<DateInput locale="it-IT" aria-label="Date" value="2026-02-20" />
		);
		expect( editor() ).toHaveValue( '20/02/2026' );
		view.rerender(
			<DateInput locale="en-US" aria-label="Date" value="2026-02-20" />
		);
		expect( editor() ).toHaveValue( '02/20/2026' );
	} );
	it( 'formats bounds for the editor locale while validating ISO dates', async () => {
		const user = userEvent.setup();
		render(
			<DateInput
				locale="it-IT"
				aria-label="Date"
				min="2026-02-20"
				max="2026-02-28"
			/>
		);
		await user.type( editor(), '19/02/2026' );
		expect( editor().validationMessage ).toBe(
			'Enter a date on or after 20/02/2026.'
		);
		await user.clear( editor() );
		await user.type( editor(), '01/03/2026' );
		expect( editor().validationMessage ).toBe(
			'Enter a date on or before 28/02/2026.'
		);
	} );
	it( 'inherits disabled state for both visible and serialized inputs', () => {
		render(
			<form>
				<Field.Root name="date" disabled>
					<Field.Label>Date</Field.Label>
					<DateInput locale="it-IT" defaultValue="2026-02-20" />
				</Field.Root>
			</form>
		);
		expect( editor() ).toBeDisabled();
		expect( new FormData( editor().form! ).has( 'date' ) ).toBe( false );
	} );
	it( 'preserves a read-only ISO value when constraints would reject an editable date', async () => {
		const submit = vi.fn();
		const user = userEvent.setup();
		render(
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					submit( new FormData( event.currentTarget ).get( 'date' ) );
				} }
			>
				<DateInput
					locale="it-IT"
					aria-label="Date"
					name="date"
					readOnly
					defaultValue="2026-02-20"
					min="2026-02-21"
				/>
				<button>Save</button>
			</form>
		);
		expect( editor() ).toHaveValue( '20/02/2026' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).toHaveBeenCalledWith( '2026-02-20' );
	} );

	it.fails(
		'BLOCKED: keeps the field pristine when only the locale changes',
		() => {
			const example = ( locale: string ) => (
				<Field.Root data-testid="field">
					<Field.Label>Date</Field.Label>
					<DateInput locale={ locale } value="2026-02-20" />
				</Field.Root>
			);
			const view = render( example( 'it-IT' ) );
			view.rerender( example( 'en-US' ) );
			expect( editor() ).toHaveValue( '02/20/2026' );
			expect( screen.getByTestId( 'field' ) ).not.toHaveAttribute(
				'data-dirty'
			);
		}
	);

	// Known unmet contract. These assertions must remain ISO; changing the expected
	// value to localized text would hide the integration failure. See README.md.
	it.fails( 'BLOCKED: submits ISO dates through Base UI Form', async () => {
		const submit = vi.fn();
		const user = userEvent.setup();
		render(
			<Form onFormSubmit={ submit }>
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<DateInput locale="it-IT" defaultValue="2026-02-20" />
				</Field.Root>
				<button>Save</button>
			</Form>
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit.mock.calls[ 0 ][ 0 ] ).toEqual( { date: '2026-02-20' } );
	} );
	it.fails.each( [ 'onChange', 'onBlur', 'onSubmit' ] as const )(
		'BLOCKED: passes ISO dates to Field.validate in %s mode',
		async ( mode ) => {
			const validate = vi.fn();
			const user = userEvent.setup();
			render(
				<Form validationMode={ mode } onFormSubmit={ vi.fn() }>
					<Field.Root name="date" validate={ validate }>
						<Field.Label>Date</Field.Label>
						<DateInput locale="it-IT" />
					</Field.Root>
					<button>Save</button>
				</Form>
			);
			await user.type( editor(), '20/02/2026' );
			await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
			expect( validate.mock.lastCall ).toEqual( [
				'2026-02-20',
				{ date: '2026-02-20' },
			] );
		}
	);
} );
