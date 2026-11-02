import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRef, useState } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import { ControlWithError } from '../../control-with-error';
import { DateInput } from '../date-input';
import { DateRangeInput } from '../date-range-input';
import { TimeInput } from '../time-input';
import { DateInputControl } from '../../../date-text-input-control/date-text-input-control';

const textbox = () => screen.getByRole< HTMLInputElement >( 'textbox' );
const openCalendar = async () =>
	userEvent.click( screen.getByRole( 'button', { name: /^Choose date/ } ) );

describe( 'date text inputs in the browser', () => {
	it.each( [
		'',
		'2026-',
		'2026-02-30',
		'2025-12-31',
		'2026-02-01',
		'2026-01-25',
	] )(
		'blocks native submission for %s and focuses the current draft',
		async ( draft ) => {
			const submit = vi.fn( ( event: React.FormEvent ) =>
				event.preventDefault()
			);
			await render(
				<form onSubmit={ submit }>
					<DateInputControl
						label="Date"
						name="date"
						required
						defaultValue="2026-01-20"
						min="2026-01-01"
						max="2026-01-31"
						isDateUnavailable={ ( date ) => date === '2026-01-25' }
					/>
					<button type="submit">Save</button>
				</form>
			);
			await userEvent.fill( textbox(), draft );
			await userEvent.click(
				screen.getByRole( 'button', { name: 'Save' } )
			);
			expect( submit ).not.toHaveBeenCalled();
			expect( textbox() ).toHaveFocus();
			expect( textbox() ).toHaveValue( draft );
			// FormData itself does not validate. It contains the current draft, never a hidden stale date.
			expect( new FormData( textbox().form! ).getAll( 'date' ) ).toEqual(
				[ draft ]
			);
		}
	);
	it( 'submits canonical date, interval, and seconds values through a native form', async () => {
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
				<DateInput
					aria-label="Date"
					name="date"
					defaultValue="0099-01-20"
				/>
				<DateRangeInput
					aria-label="Range"
					name="range"
					defaultValue={ { from: '2026-01-20', to: '2026-01-22' } }
				/>
				<TimeInput
					aria-label="Time"
					name="time"
					precision="second"
					defaultValue="10:30:15"
				/>
				<button type="submit">Save</button>
			</form>
		);
		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).toHaveBeenCalledWith( {
			date: '0099-01-20',
			range: '2026-01-20/2026-01-22',
			time: '10:30:15',
		} );
	} );
	it( 'blocks Enter on an invalid Base UI field and submits after correction', async () => {
		const submit = vi.fn();
		await render(
			<Form onFormSubmit={ submit }>
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<DateInput />
					<Field.Error />
				</Field.Root>
				<button type="submit">Save</button>
			</Form>
		);
		await userEvent.fill( textbox(), '2026-02-30' );
		await userEvent.keyboard( '{Enter}' );
		expect( submit ).not.toHaveBeenCalled();
		expect(
			screen.getByText( 'Enter a valid date in YYYY-MM-DD format.' )
		).toBeVisible();
		await userEvent.fill( textbox(), '2026-02-28' );
		await userEvent.keyboard( '{Enter}' );
		expect( submit ).toHaveBeenCalledWith(
			{ date: '2026-02-28' },
			expect.anything()
		);
	} );
	it( 'supports native caret movement, deletion and clearing', async () => {
		const change = vi.fn();
		await render(
			<DateInput
				aria-label="Date"
				defaultValue="2026-01-20"
				onValueChange={ change }
			/>
		);
		const input = screen.getByRole< HTMLInputElement >( 'textbox', {
			name: 'Date',
		} );
		await userEvent.click( input );
		await userEvent.keyboard( '{End}{Backspace}' );
		expect( input ).toHaveValue( '2026-01-2' );
		expect( change ).not.toHaveBeenCalled();
		await userEvent.keyboard( '1' );
		expect( change ).toHaveBeenLastCalledWith(
			'2026-01-21',
			expect.anything()
		);
		await userEvent.clear( input );
		expect( change ).toHaveBeenLastCalledWith( null, expect.anything() );
	} );
	it( 'inherits native fieldset disabling and omits disabled values from FormData', async () => {
		await render(
			<form>
				<fieldset disabled>
					<DateInputControl
						label="Date"
						name="date"
						showCalendar
						defaultValue="2026-01-20"
					/>
				</fieldset>
				<button>Next</button>
			</form>
		);
		expect( textbox() ).toBeDisabled();
		expect(
			screen.getByRole( 'button', { name: /^Choose date/ } )
		).toBeDisabled();
		expect( new FormData( textbox().form! ).has( 'date' ) ).toBe( false );
	} );
	it( 'keeps read-only text selectable without changing it', async () => {
		const change = vi.fn();
		await render(
			<DateInputControl
				label="Date"
				readOnly
				showCalendar
				defaultValue="2026-01-20"
				onValueChange={ change }
			/>
		);
		await userEvent.click( screen.getByText( 'Date' ) );
		expect( textbox() ).toHaveFocus();
		await userEvent.keyboard( '{End}{Backspace}1' );
		expect( textbox() ).toHaveValue( '2026-01-20' );
		expect( change ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'button', { name: /^Choose date/ } )
		).toBeDisabled();
	} );
	it( 'synchronizes keyboard calendar selection with Base UI state, validation, and submission', async () => {
		const submit = vi.fn();
		await render(
			<Form
				errors={ { date: 'Server rejected this date.' } }
				onFormSubmit={ submit }
			>
				<Field.Root name="date" data-testid="field">
					<Field.Label>Date</Field.Label>
					<DateInput defaultValue="2026-01-20" showCalendar />
					<Field.Error />
				</Field.Root>
				<button type="submit">Save</button>
			</Form>
		);
		await openCalendar();
		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: /January 20/ } )
			).toHaveFocus()
		);
		await userEvent.keyboard( '{ArrowRight}{Enter}' );
		await waitFor( () =>
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument()
		);
		expect( textbox() ).toHaveValue( '2026-01-21' );
		await waitFor( () => expect( textbox() ).toHaveFocus() );
		expect( screen.getByTestId( 'field' ) ).toHaveAttribute( 'data-dirty' );
		expect(
			screen.queryByText( 'Server rejected this date.' )
		).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).toHaveBeenCalledWith(
			{ date: '2026-01-21' },
			expect.anything()
		);
	} );
	it( 'dismisses with Escape and outside click without changing the date', async () => {
		await render(
			<>
				<DateInputControl
					label="Date"
					defaultValue="2026-01-20"
					showCalendar
				/>
				<button style={ { position: 'fixed', right: 0, bottom: 0 } }>
					Outside
				</button>
			</>
		);
		await openCalendar();
		await userEvent.keyboard( '{ArrowRight}{Escape}' );
		await waitFor( () => expect( textbox() ).toHaveFocus() );
		expect( textbox() ).toHaveValue( '2026-01-20' );
		await openCalendar();
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Outside' } )
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument()
		);
		expect(
			screen.getByRole( 'button', { name: 'Outside' } )
		).toHaveFocus();
		expect( textbox() ).toHaveValue( '2026-01-20' );
	} );
	it( 'uses the same bounds for calendar choices and typed dates', async () => {
		await render(
			<DateInputControl
				label="Date"
				defaultValue="2026-01-20"
				showCalendar
				min="2026-01-20"
				max="2026-01-22"
			/>
		);
		await openCalendar();
		expect(
			screen.getByRole( 'button', { name: /January 19/ } )
		).toBeDisabled();
		expect(
			screen.getByRole( 'button', { name: /January 23/ } )
		).toBeDisabled();
		await userEvent.click(
			screen.getByRole( 'button', { name: /January 22/ } )
		);
		expect( textbox() ).toHaveValue( '2026-01-22' );
	} );
	it( 'keeps a partial calendar range open and submits the completed interval', async () => {
		const change = vi.fn();
		const submit = vi.fn();
		await render(
			<Form onFormSubmit={ submit }>
				<Field.Root name="range">
					<Field.Label>Range</Field.Label>
					<DateRangeInput
						showCalendar
						defaultValue={ {
							from: '2026-01-20',
							to: '2026-01-22',
						} }
						onValueChange={ change }
					/>
					<Field.Error />
				</Field.Root>
				<button type="submit">Save</button>
			</Form>
		);
		await openCalendar();
		await userEvent.click(
			screen.getByRole( 'button', { name: /January 18/ } )
		);
		expect( screen.getByRole( 'dialog' ) ).toBeVisible();
		expect( textbox() ).toHaveValue( '2026-01-18/' );
		await userEvent.click(
			screen.getByRole( 'button', { name: /January 22/ } )
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument()
		);
		expect( textbox() ).toHaveValue( '2026-01-18/2026-01-22' );
		expect( change ).toHaveBeenLastCalledWith(
			{ from: '2026-01-18', to: '2026-01-22' },
			expect.anything()
		);
		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).toHaveBeenCalledWith(
			{ range: '2026-01-18/2026-01-22' },
			expect.anything()
		);
	} );
	it( 'retains a controlled value when the consumer rejects calendar selection', async () => {
		const change = vi.fn();
		await render(
			<DateInputControl
				label="Date"
				value="2026-01-20"
				showCalendar
				onValueChange={ change }
			/>
		);
		await openCalendar();
		await userEvent.keyboard( '{ArrowRight}{Enter}' );
		expect( textbox() ).toHaveValue( '2026-01-20' );
		expect( change ).toHaveBeenCalledWith(
			'2026-01-21',
			expect.objectContaining( { reason: 'calendar-selection' } )
		);
	} );
	it( 'closes an open calendar when the parent Field becomes disabled', async () => {
		function Example() {
			const [ disabled, setDisabled ] = useState( false );
			return (
				<>
					<Field.Root disabled={ disabled }>
						<Field.Label>Date</Field.Label>
						<DateInput defaultValue="2026-01-20" showCalendar />
					</Field.Root>
					<button
						style={ { position: 'fixed', right: 0, bottom: 0 } }
						onClick={ () => setDisabled( true ) }
					>
						Disable
					</button>
				</>
			);
		}
		await render( <Example /> );
		await openCalendar();
		await userEvent.click(
			screen.getByRole( 'button', { name: 'Disable' } )
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument()
		);
		expect( textbox() ).toBeDisabled();
	} );
	it.each( [
		[ 'en-US', 'ltr' ],
		[ 'it-IT', 'ltr' ],
		[ 'ar-EG', 'rtl' ],
		[ 'fa-IR', 'rtl' ],
		[ 'ja-JP', 'ltr' ],
	] )(
		'localizes the %s calendar while retaining explicitly ISO text',
		async ( locale, direction ) => {
			await render(
				<DateInputControl
					label="Date"
					locale={ locale }
					defaultValue="2026-01-20"
					showCalendar
				/>
			);
			await openCalendar();
			expect( screen.getByRole( 'application' ) ).toHaveAttribute(
				'dir',
				direction
			);
			expect( textbox() ).toHaveAttribute( 'dir', 'ltr' );
			expect( textbox() ).toHaveValue( '2026-01-20' );
		}
	);
} );

describe( 'native WordPress validation wrapper', () => {
	it( 'blocks an impossible date and focuses the visible input on submit', async () => {
		const ref = createRef< HTMLInputElement >();
		const submit = vi.fn( ( event: React.FormEvent ) =>
			event.preventDefault()
		);
		await render(
			<form onSubmit={ submit }>
				<ControlWithError getValidityTarget={ () => ref.current }>
					<DateInputControl
						ref={ ref }
						label="Date"
						defaultValue="2026-01-20"
					/>
				</ControlWithError>
				<button type="submit">Save</button>
			</form>
		);
		await userEvent.fill( textbox(), '2026-02-30' );
		// Let blur reveal the error before clicking the button, whose position changes.
		await userEvent.tab();
		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).not.toHaveBeenCalled();
		await waitFor( () => expect( textbox() ).toHaveFocus() );
		await waitFor( () =>
			expect(
				screen.getByText( 'Enter a valid date in YYYY-MM-DD format.' )
			).toBeVisible()
		);
		await userEvent.fill( textbox(), '2026-02-28' );
		await userEvent.keyboard( '{Enter}' );
		expect( submit ).toHaveBeenCalledOnce();
	} );
} );
