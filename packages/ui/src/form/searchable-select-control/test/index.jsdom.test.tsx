import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { SearchableSelectControl } from '../index';

describe( 'SearchableSelectControl', () => {
	const mockItems = [
		{ value: '', label: 'Select' },
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'cherry', label: 'Cherry' },
	];

	it( 'forwards ref to the visible trigger', () => {
		const ref = createRef< HTMLButtonElement >();

		render(
			<SearchableSelectControl
				ref={ ref }
				label="Fruit"
				items={ mockItems }
			/>
		);

		const trigger = screen.getByRole( 'combobox', { name: 'Fruit' } );

		expect( ref.current ).toBe( trigger );
		act( () => {
			ref.current?.focus();
		} );
		expect( trigger ).toHaveFocus();
	} );

	it( 'calls focus and blur handlers passed to the trigger slot', async () => {
		const user = userEvent.setup();
		const onFocus = vi.fn();
		const onBlur = vi.fn();

		render(
			<>
				<SearchableSelectControl
					label="Fruit"
					items={ mockItems }
					trigger={
						<SearchableSelectControl.Trigger
							onFocus={ onFocus }
							onBlur={ onBlur }
						/>
					}
				/>
				<button>Next field</button>
			</>
		);

		const trigger = screen.getByRole( 'combobox', { name: 'Fruit' } );

		await user.tab();
		expect( trigger ).toHaveFocus();
		expect( onFocus ).toHaveBeenCalledTimes( 1 );
		expect( onFocus.mock.calls[ 0 ][ 0 ].target ).toBe( trigger );
		expect( onBlur ).not.toHaveBeenCalled();

		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Next field' } )
		).toHaveFocus();
		expect( onBlur ).toHaveBeenCalledTimes( 1 );
		expect( onBlur.mock.calls[ 0 ][ 0 ].target ).toBe( trigger );
	} );

	it( 'forwards both control and trigger slot refs to the visible trigger', () => {
		const controlRef = createRef< HTMLButtonElement >();
		const triggerRef = createRef< HTMLButtonElement >();

		const { unmount } = render(
			<SearchableSelectControl
				ref={ controlRef }
				label="Fruit"
				items={ mockItems }
				trigger={
					<SearchableSelectControl.Trigger ref={ triggerRef } />
				}
			/>
		);

		const trigger = screen.getByRole( 'combobox', { name: 'Fruit' } );

		expect( controlRef.current ).toBe( trigger );
		expect( triggerRef.current ).toBe( trigger );

		unmount();
		expect( controlRef.current ).toBeNull();
		expect( triggerRef.current ).toBeNull();
	} );

	it( 'preserves the placeholder and lets trigger slot props override it', () => {
		const { rerender } = render(
			<SearchableSelectControl
				label="Fruit"
				placeholder="Choose a fruit"
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Fruit' } )
		).toHaveTextContent( 'Choose a fruit' );

		rerender(
			<SearchableSelectControl
				label="Fruit"
				placeholder="Choose a fruit"
				trigger={ <SearchableSelectControl.Trigger /> }
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Fruit' } )
		).toHaveTextContent( 'Choose a fruit' );

		rerender(
			<SearchableSelectControl
				label="Fruit"
				placeholder="Choose a fruit"
				trigger={
					<SearchableSelectControl.Trigger placeholder="Choose a berry" />
				}
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Fruit' } )
		).toHaveTextContent( 'Choose a berry' );
	} );

	it( 'renders accessible label and description', () => {
		render(
			<SearchableSelectControl
				label="Fruit"
				description="Choose your favorite fruit"
				items={ mockItems }
			/>
		);

		expect(
			screen.getByRole( 'combobox', {
				name: 'Fruit',
				description: 'Choose your favorite fruit',
			} )
		).toBeVisible();
	} );

	it( 'uses the field label to name the popup dialog', async () => {
		const user = userEvent.setup();

		render( <SearchableSelectControl label="Fruit" items={ mockItems } /> );

		await user.click( screen.getByRole( 'combobox', { name: 'Fruit' } ) );

		expect(
			await screen.findByRole( 'dialog', { name: 'Fruit' } )
		).toBeVisible();
	} );

	describe( 'Form data behavior', () => {
		it( 'submits correct form data when option is selected with custom name', async () => {
			const user = userEvent.setup();
			const handleSubmit = vi.fn(
				( event: React.FormEvent< HTMLFormElement > ) => {
					event.preventDefault();
					return new FormData( event.currentTarget );
				}
			);

			render(
				<form onSubmit={ handleSubmit }>
					<SearchableSelectControl
						label="Fruit"
						name="fruit"
						items={ mockItems }
					/>
					<button type="submit">Submit</button>
				</form>
			);

			await user.click(
				screen.getByRole( 'combobox', {
					name: 'Fruit',
				} )
			);

			const optionToSelect = await screen.findByRole( 'option', {
				name: /Banana/i,
			} );
			await user.click( optionToSelect );

			await user.click(
				screen.getByRole( 'button', {
					name: 'Submit',
				} )
			);

			const formData = handleSubmit.mock.results[ 0 ].value;
			expect( formData.get( 'fruit' ) ).toBe( 'banana' );
		} );

		it( 'submits form data with default value when no selection is made', async () => {
			const user = userEvent.setup();
			const handleSubmit = vi.fn(
				( event: React.FormEvent< HTMLFormElement > ) => {
					event.preventDefault();
					return new FormData( event.currentTarget );
				}
			);

			render(
				<form onSubmit={ handleSubmit }>
					<SearchableSelectControl
						label="Fruit"
						name="fruit"
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
			expect( formData.get( 'fruit' ) ).toBe( '' );
		} );
	} );
} );
