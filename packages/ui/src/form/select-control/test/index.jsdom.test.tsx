import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import type { ReactNode } from 'react';
import { SelectControl } from '../index';
import { useEnableWpCompatOverlaySlot } from '../../../utils/use-enable-wp-compat-overlay-slot';

describe( 'SelectControl', () => {
	const mockItems = [
		{ value: '', label: 'Select' },
		{ value: 'option1', label: 'Option 1' },
		{ value: 'option2', label: 'Option 2' },
		{ value: 'option3', label: 'Option 3' },
	];

	it( 'forwards ref to the visible trigger', () => {
		const ref = createRef< HTMLButtonElement >();

		render(
			<SelectControl ref={ ref } label="Country" items={ mockItems } />
		);

		const trigger = screen.getByRole( 'combobox', { name: 'Country' } );

		expect( ref.current ).toBe( trigger );
		act( () => {
			ref.current?.focus();
		} );
		expect( trigger ).toHaveFocus();
	} );

	it( 'renders accessible label and description', () => {
		render(
			<SelectControl
				label="Country"
				description="Choose your country"
				items={ mockItems }
			/>
		);

		expect(
			screen.getByRole( 'combobox', {
				name: 'Country',
				description: 'Choose your country',
			} )
		).toBeVisible();
	} );

	it( 'renders custom placeholder text when no value is selected', () => {
		render(
			<SelectControl
				label="Country"
				items={ mockItems }
				placeholder="Choose a country"
			/>
		);

		expect(
			screen.getByRole( 'combobox', {
				name: 'Country',
			} )
		).toHaveTextContent( 'Choose a country' );
	} );

	it( 'renders with a visually hidden label', () => {
		render(
			<SelectControl
				label="Country"
				hideLabelFromVision
				items={ mockItems }
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Country' } )
		).toBeVisible();
	} );

	it( 'renders with details', () => {
		render(
			<SelectControl
				label="Country"
				items={ mockItems }
				details={
					<span>
						Select the country where your store is registered.
					</span>
				}
			/>
		);

		expect(
			screen.getByText( /where your store is registered/ )
		).toBeVisible();
	} );

	it( 'passes the current value to custom trigger content', async () => {
		const user = userEvent.setup();

		render(
			<SelectControl
				label="Country"
				items={ mockItems }
				defaultValue={ mockItems[ 1 ] }
				triggerContent={ ( item ) => `Selected ${ item.label }` }
			/>
		);

		const trigger = screen.getByRole( 'combobox', {
			name: 'Country',
		} );

		expect( trigger ).toHaveTextContent( 'Selected Option 1' );

		await user.click( trigger );
		await user.click(
			await screen.findByRole( 'option', {
				name: 'Option 2',
			} )
		);

		expect( trigger ).toHaveTextContent( 'Selected Option 2' );
	} );

	describe( 'Form data behavior', () => {
		it( 'submits correct form data when option is selected with custom name', async () => {
			const user = userEvent.setup();
			const handleSubmit = jest.fn(
				( event: React.FormEvent< HTMLFormElement > ) => {
					event.preventDefault();
					return new FormData( event.currentTarget );
				}
			);

			render(
				<form onSubmit={ handleSubmit }>
					<SelectControl
						label="Country"
						name="country"
						items={ mockItems }
					/>
					<button type="submit">Submit</button>
				</form>
			);

			await user.click(
				screen.getByRole( 'combobox', {
					name: 'Country',
				} )
			);

			const optionToSelect = await screen.findByRole( 'option', {
				name: /Option 2/i,
			} );
			await user.click( optionToSelect );

			await user.click(
				screen.getByRole( 'button', {
					name: 'Submit',
				} )
			);

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'country' ) ).toBe( 'option2' );
		} );

		it( 'submits form data with default value when no selection is made', async () => {
			const user = userEvent.setup();
			const handleSubmit = jest.fn(
				( event: React.FormEvent< HTMLFormElement > ) => {
					event.preventDefault();
					return new FormData( event.currentTarget );
				}
			);

			render(
				<form onSubmit={ handleSubmit }>
					<SelectControl
						label="Country"
						name="country"
						items={ mockItems }
						defaultValue={ mockItems[ 0 ] }
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
			expect( formData.get( 'country' ) ).toBe( '' );
		} );
	} );

	// Slot is identified by a data attribute, not a user-facing role/text.
	/* eslint-disable testing-library/no-node-access */
	describe( 'wp compat overlay slot', () => {
		const SLOT_SELECTOR = '[data-wp-compat-overlay-slot]';

		// Exercises the public opt-in path rather than poking the flag.
		function WithSlotEnabled( { children }: { children: ReactNode } ) {
			useEnableWpCompatOverlaySlot();
			return <>{ children }</>;
		}

		afterEach( () => {
			// The hook is one-way at runtime; reset explicitly between tests.
			delete ( window as { __wpUiCompatOverlaySlotEnabled?: boolean } )
				.__wpUiCompatOverlaySlotEnabled;
			document
				.querySelectorAll( SLOT_SELECTOR )
				.forEach( ( el ) => el.remove() );
		} );

		it( 'portals the popup into the slot when the consumer opts in', async () => {
			const user = userEvent.setup();

			render(
				<WithSlotEnabled>
					<SelectControl label="Country" items={ mockItems } />
				</WithSlotEnabled>
			);

			await user.click(
				screen.getByRole( 'combobox', { name: 'Country' } )
			);

			const option = await screen.findByRole( 'option', {
				name: 'Option 1',
			} );
			expect( option ).toBeVisible();

			const slot = document.querySelector( SLOT_SELECTOR );
			expect( slot ).not.toBeNull();
			expect( slot ).toContainElement( option );
		} );

		it( 'does not create a slot when the consumer has not opted in (dormant default)', async () => {
			const user = userEvent.setup();

			render( <SelectControl label="Country" items={ mockItems } /> );

			await user.click(
				screen.getByRole( 'combobox', { name: 'Country' } )
			);

			const option = await screen.findByRole( 'option', {
				name: 'Option 1',
			} );
			expect( option ).toBeVisible();

			expect( document.querySelector( SLOT_SELECTOR ) ).toBeNull();
		} );
	} );
	/* eslint-enable testing-library/no-node-access */
} );
