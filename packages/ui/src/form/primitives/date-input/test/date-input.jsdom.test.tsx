import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { Form } from '@base-ui/react/form';
import { Field as BaseField } from '@base-ui/react/field';
import * as Field from '../../field';
import { DateInput } from '../date-input';

describe( 'DateInput field integration', () => {
	it( 'focuses a read-only segment from the forwarded ref', () => {
		const ref = createRef< HTMLInputElement >();
		render(
			<DateInput
				ref={ ref }
				aria-label="Date"
				defaultValue="2026-01-20"
				readOnly
				locale="en-US"
			/>
		);
		act( () => ref.current?.focus() );
		expect( screen.getAllByRole( 'spinbutton' )[ 0 ] ).toHaveFocus();
	} );

	it( 'labels each segment and describes the first editable segment', () => {
		render(
			<Field.Root name="date">
				<Field.Label>Event date</Field.Label>
				<DateInput defaultValue="2026-01-20" locale="en-US" />
				<Field.Description>Choose a date.</Field.Description>
			</Field.Root>
		);
		for ( const segment of screen.getAllByRole( 'spinbutton' ) ) {
			expect( segment ).toHaveAccessibleName( /Event date/ );
		}
		// React Aria announces the description once when entering the field.
		expect(
			screen.getAllByRole( 'spinbutton' )[ 0 ]
		).toHaveAccessibleDescription( /Choose a date/ );
	} );

	it( 'does not mark the field touched when its label moves focus into it', async () => {
		const user = userEvent.setup();
		const ref = createRef< HTMLDivElement >();
		render(
			<Field.Root ref={ ref }>
				<Field.Label>Date</Field.Label>
				<DateInput locale="en-US" />
			</Field.Root>
		);
		await user.click( screen.getByText( 'Date' ) );
		expect( screen.getAllByRole( 'spinbutton' )[ 0 ] ).toHaveFocus();
		expect( ref.current ).not.toHaveAttribute( 'data-touched' );
	} );

	it( 'inherits disabled state from Field.Root', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		render(
			<Field.Root disabled>
				<Field.Label>Date</Field.Label>
				<DateInput
					defaultValue="2026-01-20"
					onValueChange={ change }
					locale="en-US"
				/>
			</Field.Root>
		);
		for ( const segment of screen.getAllByRole( 'spinbutton' ) ) {
			expect( segment ).toHaveAttribute( 'aria-disabled', 'true' );
		}
		await user.tab();
		expect( screen.getAllByRole( 'spinbutton' )[ 0 ] ).not.toHaveFocus();
		expect( change ).not.toHaveBeenCalled();
	} );

	it( 'preserves a rejected controlled change', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		render(
			<DateInput
				aria-label="Date"
				value="2026-01-20"
				onValueChange={ change }
				locale="en-US"
			/>
		);
		await user.click( screen.getByRole( 'spinbutton', { name: /day,/ } ) );
		await user.keyboard( '{ArrowUp}' );
		expect( change ).toHaveBeenCalledWith( '2026-01-21' );
		expect(
			screen.getByRole( 'spinbutton', { name: /day,/ } )
		).toHaveValue( 20 );
	} );

	it( 'updates an uncontrolled date and marks the field dirty', async () => {
		const user = userEvent.setup();
		const ref = createRef< HTMLDivElement >();
		render(
			<Field.Root ref={ ref }>
				<Field.Label>Date</Field.Label>
				<DateInput defaultValue="2026-01-20" locale="en-US" />
			</Field.Root>
		);
		await user.click( screen.getByRole( 'spinbutton', { name: /day,/ } ) );
		await user.keyboard( '{ArrowUp}' );
		expect(
			screen.getByRole( 'spinbutton', { name: /day,/ } )
		).toHaveValue( 21 );
		expect( ref.current ).toHaveAttribute( 'data-dirty' );
	} );

	it( 'marks an incomplete edit dirty even before a complete date exists', async () => {
		const user = userEvent.setup();
		const ref = createRef< HTMLDivElement >();
		render(
			<Field.Root ref={ ref }>
				<Field.Label>Date</Field.Label>
				<DateInput locale="en-US" />
			</Field.Root>
		);
		await user.click(
			screen.getByRole( 'spinbutton', { name: /month,/ } )
		);
		await user.keyboard( '01' );
		expect( ref.current ).toHaveAttribute( 'data-dirty' );
	} );

	it( 'restores the uncontrolled default on native form reset', async () => {
		const user = userEvent.setup();
		render(
			<form>
				<DateInput
					aria-label="Date"
					defaultValue="2026-01-20"
					locale="en-US"
				/>
				<button type="reset">Reset</button>
			</form>
		);
		await user.click( screen.getByRole( 'spinbutton', { name: /day,/ } ) );
		await user.keyboard( '{ArrowUp}' );
		await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
		expect(
			screen.getByRole( 'spinbutton', { name: /day,/ } )
		).toHaveValue( 20 );
	} );

	it( 'treats null as an empty controlled date', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		render(
			<DateInput
				aria-label="Date"
				value={ null }
				onValueChange={ change }
				locale="en-US"
			/>
		);
		const month = screen.getByRole( 'spinbutton', { name: /month,/ } );
		expect( month ).not.toHaveAttribute( 'aria-valuenow' );
		await user.click( screen.getByRole( 'spinbutton', { name: /year,/ } ) );
		await user.keyboard( '2026' );
		await user.click( month );
		await user.keyboard( '01' );
		await user.click( screen.getByRole( 'spinbutton', { name: /day,/ } ) );
		await user.keyboard( '2' );
		expect( change ).toHaveBeenCalledWith( '2026-01-02' );
		expect( month ).not.toHaveAttribute( 'aria-valuenow' );
	} );

	it( 'keeps a read-only date unchanged during keyboard editing', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		render(
			<DateInput
				aria-label="Date"
				defaultValue="2026-01-20"
				onValueChange={ change }
				readOnly
				locale="en-US"
			/>
		);
		await user.click( screen.getByRole( 'spinbutton', { name: /day,/ } ) );
		await user.keyboard( '{ArrowUp}{Backspace}25' );
		expect( change ).not.toHaveBeenCalled();
	} );

	it( 'reflects external controlled updates', () => {
		const { rerender } = render(
			<DateInput aria-label="Date" value="2026-01-20" locale="en-US" />
		);
		rerender(
			<DateInput aria-label="Date" value="2028-02-29" locale="en-US" />
		);
		expect(
			screen.getByRole( 'spinbutton', { name: /day,/ } )
		).toHaveValue( 29 );
		expect(
			screen.getByRole( 'spinbutton', { name: /year,/ } )
		).toHaveValue( 2028 );
	} );

	it( 'focuses the first editable segment from the field label', async () => {
		const user = userEvent.setup();
		render(
			<Field.Root>
				<Field.Label>Event date</Field.Label>
				<DateInput locale="en-US" />
			</Field.Root>
		);
		await user.click( screen.getByText( 'Event date' ) );
		expect( screen.getAllByRole( 'spinbutton' )[ 0 ] ).toHaveFocus();
	} );

	it( 'focuses the first editable segment from the forwarded input ref', () => {
		const ref = createRef< HTMLInputElement >();
		render( <DateInput ref={ ref } aria-label="Date" locale="en-US" /> );
		act( () => ref.current?.focus() );
		expect( screen.getAllByRole( 'spinbutton' )[ 0 ] ).toHaveFocus();
	} );

	it( 'submits the canonical value through Base UI Form', async () => {
		const user = userEvent.setup();
		const submit = vi.fn();
		render(
			<Form onFormSubmit={ submit }>
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<DateInput defaultValue="2026-01-20" locale="en-US" />
				</Field.Root>
				<button type="submit">Save</button>
			</Form>
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).toHaveBeenCalledWith(
			{ date: '2026-01-20' },
			expect.anything()
		);
	} );

	it( 'marks the field touched only after leaving the segmented editor', async () => {
		const user = userEvent.setup();
		const ref = createRef< HTMLDivElement >();
		render(
			<>
				<Field.Root ref={ ref }>
					<Field.Label>Date</Field.Label>
					<DateInput locale="en-US" />
				</Field.Root>
				<button>Next</button>
			</>
		);
		await user.click( screen.getAllByRole( 'spinbutton' )[ 0 ] );
		expect( ref.current ).not.toHaveAttribute( 'data-touched' );
		await user.tab();
		expect( ref.current ).not.toHaveAttribute( 'data-touched' );
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		expect( ref.current ).toHaveAttribute( 'data-touched' );
	} );

	it( 'validates the canonical value when the segmented editor loses focus', async () => {
		const user = userEvent.setup();
		const validate = vi.fn();
		render(
			<>
				<BaseField.Root validate={ validate } validationMode="onBlur">
					<BaseField.Label>Date</BaseField.Label>
					<DateInput defaultValue="2026-01-20" locale="en-US" />
				</BaseField.Root>
				<button>Next</button>
			</>
		);
		await user.click( screen.getAllByRole( 'spinbutton' )[ 0 ] );
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		expect( validate ).toHaveBeenCalledWith(
			'2026-01-20',
			expect.anything()
		);
	} );
} );
