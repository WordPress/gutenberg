import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { createRef } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import { ControlWithError } from '../../control-with-error';
import { DateInput } from '../date-input';
import { DateInputControl } from '../../../date-text-input-control/date-text-input-control';

const textbox = () => screen.getByRole< HTMLInputElement >( 'textbox' );
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
						locale="sv-SE"
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
			// Invalid drafts never serialize a stale selected date.
			expect( new FormData( textbox().form! ).getAll( 'date' ) ).toEqual(
				[
					[ '2025-12-31', '2026-02-01', '2026-01-25' ].includes(
						draft
					)
						? draft
						: '',
				]
			);
		}
	);
	it( 'submits a canonical early-year date from localized text through a native form', async () => {
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
					locale="it-IT"
					aria-label="Date"
					name="date"
					defaultValue="0099-01-20"
				/>
				<button type="submit">Save</button>
			</form>
		);
		expect( textbox() ).toHaveValue( '20/01/0099' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).toHaveBeenCalledWith( {
			date: '0099-01-20',
		} );
	} );
	it( 'blocks Enter on an invalid Base UI field and submits after correction', async () => {
		const submit = vi.fn();
		await render(
			<Form onFormSubmit={ submit }>
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<DateInput locale="sv-SE" />
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
				locale="sv-SE"
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
						locale="sv-SE"
						label="Date"
						name="date"
						defaultValue="2026-01-20"
					/>
				</fieldset>
				<button>Next</button>
			</form>
		);
		expect( textbox() ).toBeDisabled();
		expect( new FormData( textbox().form! ).has( 'date' ) ).toBe( false );
	} );
	it( 'keeps read-only text selectable without changing it', async () => {
		const change = vi.fn();
		await render(
			<DateInputControl
				locale="sv-SE"
				label="Date"
				readOnly
				defaultValue="2026-01-20"
				onValueChange={ change }
			/>
		);
		await userEvent.click( screen.getByText( 'Date' ) );
		expect( textbox() ).toHaveFocus();
		await userEvent.keyboard( '{End}{Backspace}1' );
		expect( textbox() ).toHaveValue( '2026-01-20' );
		expect( change ).not.toHaveBeenCalled();
	} );
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
						locale="sv-SE"
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

describe( 'localized native form in the browser', () => {
	it( 'retains invalid Italian text, blocks submission, and submits ISO after correction', async () => {
		const submit = vi.fn();
		const change = vi.fn();
		await render(
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					submit(
						new FormData( event.currentTarget ).getAll( 'date' )
					);
				} }
			>
				<DateInputControl
					locale="it-IT"
					label="Date"
					name="date"
					defaultValue="2026-02-20"
					onValueChange={ change }
				/>
				<button>Save</button>
			</form>
		);
		await userEvent.fill( textbox(), '30/02/2026' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( submit ).not.toHaveBeenCalled();
		expect( textbox() ).toHaveFocus();
		expect( textbox() ).toHaveValue( '30/02/2026' );
		expect( new FormData( textbox().form! ).getAll( 'date' ) ).toEqual( [
			'',
		] );
		await userEvent.fill( textbox(), '28/02/2026' );
		await userEvent.keyboard( '{Enter}' );
		expect( submit ).toHaveBeenCalledWith( [ '2026-02-28' ] );
		expect( change ).toHaveBeenLastCalledWith(
			'2026-02-28',
			expect.anything()
		);
	} );
	it.fails(
		'BLOCKED: submits an ISO date through Base UI Form from localized text',
		async () => {
			const submit = vi.fn();
			await render(
				<Form onFormSubmit={ submit }>
					<Field.Root name="date">
						<Field.Label>Date</Field.Label>
						<DateInput locale="it-IT" />
					</Field.Root>
					<button>Save</button>
				</Form>
			);
			await userEvent.fill( textbox(), '20/02/2026' );
			await userEvent.keyboard( '{Enter}' );
			expect( submit.mock.calls[ 0 ][ 0 ] ).toEqual( {
				date: '2026-02-20',
			} );
		}
	);
} );
