import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { IconButton } from '../index';

describe( 'IconButton', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLButtonElement >();

		render( <IconButton ref={ ref } label="Click me" icon={ <svg /> } /> );

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'respects custom render prop as handled by Button', () => {
		render(
			<IconButton
				label="Click me"
				icon={ <svg /> }
				variant="outline"
				disabled
				focusableWhenDisabled
				render={ <button data-testid="button" /> }
			/>
		);

		// Should render as a button from `render` prop...
		const button = screen.getByRole( 'button', { name: 'Click me' } );
		expect( button ).toHaveAttribute( 'data-testid', 'button' );

		// ...and still inherit the behavior of Button
		expect( button ).toBeEnabled();
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	describe( 'tooltip with disabled state', () => {
		it( 'does not show tooltip when truly disabled', async () => {
			const user = userEvent.setup();

			render( <IconButton label="Save" icon={ <svg /> } disabled /> );

			const button = screen.getByRole( 'button', { name: 'Save' } );
			await user.hover( button );

			expect( screen.queryByText( 'Save' ) ).not.toBeInTheDocument();
		} );

		it( 'shows tooltip when focusably disabled', async () => {
			const user = userEvent.setup();

			render(
				<IconButton
					label="Save"
					icon={ <svg /> }
					disabled
					focusableWhenDisabled
				/>
			);

			const button = screen.getByRole( 'button', { name: 'Save' } );
			await user.hover( button );

			await waitFor( () => {
				expect( screen.getByText( 'Save' ) ).toBeVisible();
			} );
		} );
	} );

	describe( 'shortcut', () => {
		it( 'sets aria-keyshortcuts attribute on the button', () => {
			const { rerender } = render(
				<IconButton
					label="Save"
					icon={ <svg /> }
					shortcut={ {
						displayShortcut: '⌘S',
						ariaKeyShortcut: 'Meta+S',
					} }
				/>
			);

			const button = screen.getByRole( 'button', { name: 'Save' } );
			expect( button ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );

			// The aria-keyshortcuts attribute is removed when there is no
			// `shortcut` prop.
			rerender( <IconButton label="Save" icon={ <svg /> } /> );
			expect( button ).not.toHaveAttribute( 'aria-keyshortcuts' );
		} );

		it( 'displays the shortcut in the tooltip but hides it from assistive technology', async () => {
			const user = userEvent.setup();

			render(
				<IconButton
					label="Save"
					icon={ <svg /> }
					shortcut={ {
						displayShortcut: '⌘S',
						ariaKeyShortcut: 'Meta+S',
					} }
				/>
			);

			const button = screen.getByRole( 'button', { name: 'Save' } );
			await user.hover( button );

			await waitFor( () => {
				const shortcutElement = screen.getByText( '⌘S' );
				expect( shortcutElement ).toBeVisible();
			} );

			expect( screen.getByText( '⌘S' ) ).toHaveAttribute(
				'aria-hidden',
				'true'
			);
		} );
	} );
} );
