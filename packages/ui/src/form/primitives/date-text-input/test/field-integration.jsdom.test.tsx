import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRef, useState } from '@wordpress/element';
import { ControlWithError } from '../../control-with-error';
import { DateInput } from '../date-input';
import { DateInputControl } from '../../../date-text-input-control/date-text-input-control';

describe( 'text input Field and Form integration', () => {
	it.each( [ 'onChange', 'onBlur', 'onSubmit' ] as const )(
		'inherits %s validation timing from Base UI Form',
		async ( mode ) => {
			const user = userEvent.setup();
			const validate = vi.fn();
			const submit = vi.fn();
			render(
				<Form validationMode={ mode } onFormSubmit={ submit }>
					<Field.Root name="date" validate={ validate }>
						<Field.Label>Date</Field.Label>
						<DateInput locale="sv-SE" defaultValue="2026-01-20" />
					</Field.Root>
					<button type="button">Next</button>
					<button type="submit">Save</button>
				</Form>
			);
			const input = screen.getByRole( 'textbox', { name: 'Date' } );
			await user.click( input );
			await user.keyboard( '{End}{Backspace}1' );
			expect( validate.mock.lastCall ).toEqual(
				mode === 'onChange'
					? [ '2026-01-21', { date: '2026-01-21' } ]
					: undefined
			);
			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
			expect( validate.mock.lastCall ).toEqual(
				mode !== 'onSubmit'
					? [ '2026-01-21', { date: '2026-01-21' } ]
					: undefined
			);
			await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
			expect( submit ).toHaveBeenCalledWith(
				{ date: '2026-01-21' },
				expect.anything()
			);
		}
	);
	it( 'restores a rejected controlled change and the original dirty state', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		const ref = createRef< HTMLDivElement >();
		render(
			<Field.Root ref={ ref }>
				<Field.Label>Date</Field.Label>
				<DateInput
					locale="sv-SE"
					value="2026-01-20"
					onValueChange={ change }
				/>
			</Field.Root>
		);
		await user.click( screen.getByRole( 'textbox', { name: 'Date' } ) );
		await user.keyboard( '{End}{Backspace}1' );
		expect( change ).toHaveBeenCalledWith(
			'2026-01-21',
			expect.objectContaining( { reason: 'input-change' } )
		);
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveValue(
			'2026-01-20'
		);
		expect( ref.current ).not.toHaveAttribute( 'data-dirty' );
	} );
	it( 'supports cancellation in uncontrolled mode', async () => {
		const user = userEvent.setup();
		render(
			<DateInputControl
				locale="sv-SE"
				label="Date"
				defaultValue="2026-01-20"
				onValueChange={ ( _value, details ) => details.cancel() }
			/>
		);
		await user.click( screen.getByRole( 'textbox', { name: 'Date' } ) );
		await user.keyboard( '{End}{Backspace}1' );
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveValue(
			'2026-01-20'
		);
	} );
	it( 'accepts controlled changes and replaces drafts on external updates', async () => {
		const user = userEvent.setup();
		function Example() {
			const [ value, setValue ] = useState< string | null >( null );
			return (
				<>
					<DateInputControl
						locale="sv-SE"
						label="Date"
						value={ value }
						onValueChange={ setValue }
					/>
					<button onClick={ () => setValue( '2024-02-29' ) }>
						Replace
					</button>
					<output>{ value ?? 'empty' }</output>
				</>
			);
		}
		render( <Example /> );
		await user.type(
			screen.getByRole( 'textbox', { name: 'Date' } ),
			'2026-01-20'
		);
		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'2026-01-20'
		);
		await user.keyboard( '{Backspace}' );
		await user.click( screen.getByRole( 'button', { name: 'Replace' } ) );
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveValue(
			'2024-02-29'
		);
	} );
	it.each( [ false, true ] )(
		'honors native reset and cancellation (canceled: %s)',
		async ( canceled ) => {
			const user = userEvent.setup();
			const ref = createRef< HTMLDivElement >();
			render(
				<form
					onReset={ ( event ) => {
						if ( canceled ) {
							event.preventDefault();
						}
					} }
				>
					<Field.Root ref={ ref }>
						<Field.Label>Date</Field.Label>
						<DateInput locale="sv-SE" defaultValue="2026-01-20" />
					</Field.Root>
					<button type="reset">Reset</button>
				</form>
			);
			await user.click( screen.getByRole( 'textbox', { name: 'Date' } ) );
			await user.keyboard( '{End}{Backspace}' );
			await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
			expect(
				screen.getByRole( 'textbox', { name: 'Date' } )
			).toHaveValue( canceled ? '2026-01-2' : '2026-01-20' );
			expect( ref.current?.hasAttribute( 'data-dirty' ) ).toBe(
				canceled
			);
		}
	);
	it( 'keeps a controlled value on reset without emitting a change', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		render(
			<form>
				<DateInputControl
					locale="sv-SE"
					label="Date"
					value="2026-01-20"
					onValueChange={ change }
				/>
				<button type="reset">Reset</button>
			</form>
		);
		await user.click( screen.getByRole( 'button', { name: 'Reset' } ) );
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveValue(
			'2026-01-20'
		);
		expect( change ).not.toHaveBeenCalled();
	} );
	it( 'forwards the actual input ref and preserves custom render props', () => {
		const ref = createRef< HTMLInputElement >();
		render(
			<DateInputControl
				locale="sv-SE"
				ref={ ref }
				label="Date"
				description="ISO date"
				render={ <input data-consumer="custom" /> }
			/>
		);
		const input = screen.getByRole( 'textbox', { name: 'Date' } );
		expect( ref.current ).toBe( input );
		expect( input ).toHaveAttribute( 'data-consumer', 'custom' );
		expect( input ).toHaveAccessibleDescription(
			'ISO date Use YYYY-MM-DD, for example 2026-01-20.'
		);
	} );
	it( 'inherits Field disabled state for the input', () => {
		render(
			<Field.Root disabled>
				<Field.Label>Date</Field.Label>
				<DateInput locale="sv-SE" />
			</Field.Root>
		);
		expect(
			screen.getByRole( 'textbox', { name: 'Date' } )
		).toBeDisabled();
	} );
	it( 'keeps a read-only field focusable without editing', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		render(
			<DateInputControl
				locale="sv-SE"
				label="Date"
				defaultValue="2026-01-20"
				readOnly
				onValueChange={ change }
			/>
		);
		await user.click( screen.getByText( 'Date' ) );
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveFocus();
		await user.keyboard( '{End}{Backspace}1' );
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveValue(
			'2026-01-20'
		);
		expect( change ).not.toHaveBeenCalled();
	} );
	it( 'clears a server error on a partial edit and retains date validation', async () => {
		const user = userEvent.setup();
		render(
			<Form errors={ { date: 'Server rejected this date.' } }>
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<DateInput locale="sv-SE" defaultValue="2026-01-20" />
					<Field.Error />
				</Field.Root>
			</Form>
		);
		const input = screen.getByRole( 'textbox', { name: 'Date' } );
		expect( input ).toHaveAccessibleDescription(
			'Server rejected this date. Use YYYY-MM-DD, for example 2026-01-20.'
		);
		await user.click( input );
		await user.keyboard( '{End}{Backspace}' );
		expect(
			screen.queryByText( 'Server rejected this date.' )
		).not.toBeInTheDocument();
		expect( ( input as HTMLInputElement ).validity.valid ).toBe( false );
	} );
	it( 'displays custom blur validation and validates a parent-normalized value', async () => {
		const user = userEvent.setup();
		function Example() {
			const [ value, setValue ] = useState< string | null >(
				'2026-01-20'
			);
			return (
				<>
					<Field.Root
						validationMode="onBlur"
						onBlur={ () => setValue( '2026-01-21' ) }
						validate={ ( date ) =>
							date === '2026-01-21'
								? 'Choose another date.'
								: undefined
						}
					>
						<Field.Label>Date</Field.Label>
						<DateInput
							locale="sv-SE"
							value={ value }
							onValueChange={ setValue }
						/>
						<Field.Error />
					</Field.Root>
					<button>Next</button>
				</>
			);
		}
		render( <Example /> );
		await user.click( screen.getByRole( 'textbox', { name: 'Date' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
		expect( screen.getByRole( 'textbox', { name: 'Date' } ) ).toHaveValue(
			'2026-01-21'
		);
		expect( screen.getByText( 'Choose another date.' ) ).toBeVisible();
	} );
} );

describe( 'WordPress validation wrapper integration', () => {
	it( 'preserves the input validator across wrapper renders and shows its error', async () => {
		const user = userEvent.setup();
		const ref = createRef< HTMLInputElement >();
		const submit = vi.fn( ( event: React.FormEvent ) =>
			event.preventDefault()
		);
		const example = ( description: string ) => (
			<form onSubmit={ submit }>
				<ControlWithError getValidityTarget={ () => ref.current }>
					<DateInputControl
						locale="sv-SE"
						ref={ ref }
						label="Date"
						description={ description }
						defaultValue="2026-01-20"
					/>
				</ControlWithError>
				<button type="submit">Save</button>
			</form>
		);
		const view = render( example( 'Subscription date' ) );
		const input = screen.getByRole< HTMLInputElement >( 'textbox', {
			name: 'Date',
		} );
		await user.clear( input );
		await user.type( input, '2026-02-30' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).not.toHaveBeenCalled();
		expect( input.validity.valid ).toBe( false );
		expect(
			screen.getByText( 'Enter a valid date in YYYY-MM-DD format.' )
		).toBeVisible();
		view.rerender( example( 'Updated description' ) );
		expect( input.validity.valid ).toBe( false );
		await user.clear( input );
		await user.type( input, '2026-02-28' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).toHaveBeenCalledOnce();
		expect( input.validity.valid ).toBe( true );
	} );
} );

describe( 'text clipboard input', () => {
	it( 'validates pasted text and emits only parsed dates', async () => {
		const user = userEvent.setup();
		const change = vi.fn();
		render(
			<DateInput
				locale="sv-SE"
				aria-label="Date"
				onValueChange={ change }
			/>
		);
		const input = screen.getByRole< HTMLInputElement >( 'textbox', {
			name: 'Date',
		} );
		await user.click( input );
		await user.paste( '2026-02-30' );
		expect( input ).toHaveValue( '2026-02-30' );
		expect( input.validity.valid ).toBe( false );
		expect( change ).not.toHaveBeenCalled();
		await user.clear( input );
		await user.paste( '2024-02-29' );
		expect( input ).toHaveValue( '2024-02-29' );
		expect( input.validity.valid ).toBe( true );
		expect( change ).toHaveBeenLastCalledWith(
			'2024-02-29',
			expect.anything()
		);
	} );
} );

describe( 'native form reassociation', () => {
	it( 'resets with the current form rather than its previous form', async () => {
		const user = userEvent.setup();
		const example = ( form: string ) => (
			<>
				<form id="first">
					<button type="reset">Reset first</button>
				</form>
				<form id="second">
					<button type="reset">Reset second</button>
				</form>
				<DateInput
					locale="sv-SE"
					aria-label="Date"
					form={ form }
					defaultValue="2026-01-20"
				/>
			</>
		);
		const view = render( example( 'first' ) );
		const input = screen.getByRole( 'textbox' );
		await user.clear( input );
		await user.type( input, '2026-02-21' );
		view.rerender( example( 'second' ) );
		await user.click(
			screen.getByRole( 'button', { name: 'Reset first' } )
		);
		expect( input ).toHaveValue( '2026-02-21' );
		await user.click(
			screen.getByRole( 'button', { name: 'Reset second' } )
		);
		expect( input ).toHaveValue( '2026-01-20' );
	} );
} );
