import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { Input } from '@base-ui/react/input';
import { Combobox } from '@base-ui/react/combobox';
import { useState } from '@wordpress/element';

// Expected failures document public-API alternatives that do not meet the contract.
// Keep their desired assertions intact. See README.md.
describe( 'localized value registration through Base UI public APIs', () => {
	it.fails(
		'BLOCKED: submits the canonical controlled value when render displays localized text',
		async () => {
			const submit = vi.fn();
			const validate = vi.fn();
			const user = userEvent.setup();
			render(
				<Form onFormSubmit={ submit }>
					<Field.Root name="date" validate={ validate }>
						<Field.Label>Date</Field.Label>
						<Input
							value="2026-02-20"
							render={ ( props ) => (
								<>
									<input
										{ ...props }
										name={ undefined }
										value="20/02/2026"
									/>
									<input
										type="hidden"
										name="date"
										value="2026-02-20"
									/>
								</>
							) }
						/>
					</Field.Root>
					<button>Save</button>
				</Form>
			);
			const input = screen.getByRole( 'textbox', { name: 'Date' } );
			expect( input ).toHaveValue( '20/02/2026' );
			expect(
				new FormData( ( input as HTMLInputElement ).form! ).get(
					'date'
				)
			).toBe( '2026-02-20' );
			await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
			expect( submit.mock.calls[ 0 ][ 0 ] ).toEqual( {
				date: '2026-02-20',
			} );
		}
	);

	it( 'validates the canonical controlled value on submit when render displays localized text', async () => {
		const validate = vi.fn();
		const user = userEvent.setup();
		render(
			<Form onFormSubmit={ vi.fn() }>
				<Field.Root name="date" validate={ validate }>
					<Field.Label>Date</Field.Label>
					<Input
						value="2026-02-20"
						render={ ( props ) => (
							<input { ...props } value="20/02/2026" />
						) }
					/>
				</Field.Root>
				<button>Save</button>
			</Form>
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( validate.mock.calls.at( -1 )?.[ 0 ] ).toBe( '2026-02-20' );
	} );

	it.fails(
		'BLOCKED: validates the canonical controlled value on blur with localized rendered text',
		async () => {
			const validate = vi.fn();
			const user = userEvent.setup();
			render(
				<>
					<Field.Root validationMode="onBlur" validate={ validate }>
						<Field.Label>Date</Field.Label>
						<Input
							value="2026-02-20"
							render={ ( props ) => (
								<input { ...props } value="20/02/2026" />
							) }
						/>
					</Field.Root>
					<button>Next</button>
				</>
			);
			await user.click( screen.getByRole( 'textbox', { name: 'Date' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
			expect( validate.mock.lastCall?.[ 0 ] ).toBe( '2026-02-20' );
		}
	);

	it.fails(
		'BLOCKED: focuses the editor from its label when a hidden control registers the canonical value',
		async () => {
			const user = userEvent.setup();
			render(
				<Field.Root name="date">
					<Field.Label>Date</Field.Label>
					<Field.Control
						value="2026-02-20"
						render={ ( props ) => (
							<>
								<input { ...props } type="hidden" />
								<input defaultValue="20/02/2026" />
							</>
						) }
					/>
				</Field.Root>
			);
			await user.click( screen.getByText( 'Date' ) );
			expect( screen.getByRole( 'textbox' ) ).toHaveFocus();
		}
	);

	it.fails(
		'BLOCKED: marks partial edits dirty and filled when Combobox separates the selected date from input text',
		async () => {
			function Example() {
				const [ text, setText ] = useState( '' );
				return (
					<Field.Root data-testid="field" name="date">
						<Field.Label>Date</Field.Label>
						<Combobox.Root
							value={ null }
							inputValue={ text }
							onInputValueChange={ setText }
							open={ false }
						>
							<Combobox.Input />
						</Combobox.Root>
					</Field.Root>
				);
			}
			const user = userEvent.setup();
			render( <Example /> );
			await user.type(
				screen.getByRole( 'combobox', { name: 'Date' } ),
				'20/'
			);
			expect( screen.getByTestId( 'field' ) ).toHaveAttribute(
				'data-dirty'
			);
			expect( screen.getByTestId( 'field' ) ).toHaveAttribute(
				'data-filled'
			);
		}
	);
} );
