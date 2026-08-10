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

			render(
				<IconButton
					label="Save"
					icon={ <svg /> }
					disabled
					focusableWhenDisabled={ false }
				/>
			);

			const button = screen.getByRole( 'button', { name: 'Save' } );
			await user.hover( button );

			expect( screen.queryByText( 'Save' ) ).not.toBeInTheDocument();
		} );

		it( 'shows tooltip when disabled by default', async () => {
			const user = userEvent.setup();

			render( <IconButton label="Save" icon={ <svg /> } disabled /> );

			const button = screen.getByRole( 'button', { name: 'Save' } );
			await user.hover( button );

			await waitFor( () => {
				expect( screen.getByText( 'Save' ) ).toBeVisible();
			} );
		} );
	} );

	describe( 'shortcut', () => {
		it( 'uses the human-readable label in the accessible description', () => {
			const externalDescriptionId = 'external-description';

			render(
				<>
					<span id={ externalDescriptionId }>Available offline.</span>
					<IconButton
						label="Save"
						icon={ <svg /> }
						aria-describedby={ externalDescriptionId }
						shortcut={ {
							displayShortcut: '⌘S',
							ariaKeyShortcut: 'Meta+S',
							label: 'Command S',
						} }
					/>
				</>
			);

			const button = screen.getByRole( 'button', { name: 'Save' } );
			expect( button ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );
			expect( button ).toHaveAccessibleDescription(
				'Available offline. Keyboard shortcut: Command S'
			);
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
						label: 'Command S',
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
			expect( screen.getByText( '⌘S' ) ).toHaveAttribute( 'dir', 'ltr' );
		} );

		it( 'preserves direct ARIA props when shortcut metadata is omitted', () => {
			const externalDescriptionId = 'external-description';

			render(
				<>
					<span id={ externalDescriptionId }>Available offline.</span>
					<IconButton
						label="Save"
						icon={ <svg /> }
						aria-describedby={ externalDescriptionId }
						aria-keyshortcuts="Meta+S"
					/>
				</>
			);

			const button = screen.getByRole( 'button', {
				name: 'Save',
				description: 'Available offline.',
			} );
			expect( button ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );
		} );

		it( 'keeps shortcut metadata available when focusable while disabled', () => {
			render(
				<IconButton
					label="Save"
					icon={ <svg /> }
					disabled
					shortcut={ {
						displayShortcut: '⌘S',
						ariaKeyShortcut: 'Meta+S',
						label: 'Command S',
					} }
				/>
			);

			const button = screen.getByRole( 'button', {
				name: 'Save',
				description: 'Keyboard shortcut: Command S',
			} );
			expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
			expect( button ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );
		} );
	} );
} );
