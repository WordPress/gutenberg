import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import MoreMenuItem from '../more-menu-item';

function renderMenu( children: ReactNode ) {
	return render(
		<Menu.Root>
			<Menu.Trigger>Options</Menu.Trigger>
			<Menu.Popup>{ children }</Menu.Popup>
		</Menu.Root>
	);
}

async function openMenu( user: UserEvent ) {
	await user.click( screen.getByRole( 'button', { name: 'Options' } ) );
	await screen.findByRole( 'menu' );
}

describe( 'MoreMenuItem', () => {
	describe( 'checkable roles', () => {
		it( 'keeps a checked checkbox a checkbox', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem role="menuitemcheckbox" aria-checked>
					Sidebar
				</MoreMenuItem>
			);
			await openMenu( user );

			expect(
				screen.getByRole( 'menuitemcheckbox', { name: 'Sidebar' } )
			).toBeChecked();
		} );

		it( 'keeps an unchecked checkbox a checkbox', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem role="menuitemcheckbox" aria-checked={ false }>
					Sidebar
				</MoreMenuItem>
			);
			await openMenu( user );

			expect(
				screen.getByRole( 'menuitemcheckbox', { name: 'Sidebar' } )
			).not.toBeChecked();
		} );

		it( 'keeps a checked radio a radio', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem role="menuitemradio" aria-checked>
					Visual editor
				</MoreMenuItem>
			);
			await openMenu( user );

			expect(
				screen.getByRole( 'menuitemradio', { name: 'Visual editor' } )
			).toBeChecked();
		} );

		it( 'keeps an unchecked radio a radio', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem role="menuitemradio" aria-checked={ false }>
					Visual editor
				</MoreMenuItem>
			);
			await openMenu( user );

			expect(
				screen.getByRole( 'menuitemradio', { name: 'Visual editor' } )
			).not.toBeChecked();
		} );

		it( 'takes the checked state from isSelected', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem role="menuitemcheckbox" isSelected>
					Sidebar
				</MoreMenuItem>
			);
			await openMenu( user );

			expect(
				screen.getByRole( 'menuitemcheckbox', { name: 'Sidebar' } )
			).toBeChecked();
		} );

		it( 'takes the checked state of a radio from isSelected', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem role="menuitemradio" isSelected>
					Visual editor
				</MoreMenuItem>
			);
			await openMenu( user );

			expect(
				screen.getByRole( 'menuitemradio', { name: 'Visual editor' } )
			).toBeChecked();
		} );

		it( 'keeps a checkbox of a mixed state a checkbox', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem role="menuitemcheckbox" aria-checked="mixed">
					Sidebar
				</MoreMenuItem>
			);
			await openMenu( user );

			const item = screen.getByRole( 'menuitemcheckbox', {
				name: 'Sidebar',
			} );

			// `toBePartiallyChecked` only knows the `checkbox` role.
			// eslint-disable-next-line jest-dom/prefer-checked
			expect( item ).toHaveAttribute( 'aria-checked', 'mixed' );
		} );

		it( 'runs the click handler of a checkbox with the event', async () => {
			const user = userEvent.setup();
			const onClick = jest.fn();
			renderMenu(
				<MoreMenuItem
					role="menuitemcheckbox"
					aria-checked={ false }
					onClick={ onClick }
				>
					Sidebar
				</MoreMenuItem>
			);
			await openMenu( user );
			await user.click( screen.getByRole( 'menuitemcheckbox' ) );

			expect( onClick ).toHaveBeenCalledTimes( 1 );
			expect( onClick ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'click' } )
			);
		} );

		it( 'leaves a checkbox without a click handler alone', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem role="menuitemcheckbox" aria-checked={ false }>
					Sidebar
				</MoreMenuItem>
			);
			await openMenu( user );

			await expect(
				user.click( screen.getByRole( 'menuitemcheckbox' ) )
			).resolves.not.toThrow();
		} );
	} );

	describe( 'links', () => {
		it( 'renders an item of an empty address as a link', async () => {
			const user = userEvent.setup();
			renderMenu( <MoreMenuItem href="">Help</MoreMenuItem> );
			await openMenu( user );

			expect(
				screen.getByRole( 'menuitem', { name: 'Help' } )
			).toHaveAttribute( 'href', '' );
		} );

		it( 'opens a link of a blank target in a new tab', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem href="/help" target="_blank">
					Help
				</MoreMenuItem>
			);
			await openMenu( user );

			expect( screen.getByRole( 'menuitem' ) ).toHaveAttribute(
				'target',
				'_blank'
			);
		} );

		it( 'renders a disabled link as an inert item', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem href="/help" disabled>
					Help
				</MoreMenuItem>
			);
			await openMenu( user );

			const item = screen.getByRole( 'menuitem', { name: 'Help' } );

			expect( item ).not.toHaveAttribute( 'href' );
			expect( item ).toHaveAttribute( 'aria-disabled', 'true' );
		} );
	} );

	describe( 'the legacy label', () => {
		it( 'labels an item without children', async () => {
			const user = userEvent.setup();
			renderMenu( <MoreMenuItem label="Sidebar" /> );
			await openMenu( user );

			expect(
				screen.getByRole( 'menuitem', { name: 'Sidebar' } )
			).toBeVisible();
		} );
	} );

	describe( 'shortcuts', () => {
		it( 'displays a shortcut given as a string', async () => {
			const user = userEvent.setup();
			renderMenu( <MoreMenuItem shortcut="Ctrl+S">Save</MoreMenuItem> );
			await openMenu( user );

			expect( screen.getByText( 'Ctrl+S' ) ).toBeVisible();
		} );

		it( 'displays a shortcut given as a legacy object', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem
					shortcut={ { display: 'Ctrl+S', ariaLabel: 'Control S' } }
				>
					Save
				</MoreMenuItem>
			);
			await openMenu( user );

			expect( screen.getByText( 'Ctrl+S' ) ).toBeVisible();
			expect(
				screen.getByRole( 'menuitem', { name: 'Save' } )
			).toHaveAccessibleDescription( 'Keyboard shortcut: Control S' );
		} );
	} );

	describe( 'icons', () => {
		it( 'renders a Dashicon given as a slug', async () => {
			const user = userEvent.setup();
			renderMenu(
				<MoreMenuItem icon="editor-kitchensink">Kitchen</MoreMenuItem>
			);
			await openMenu( user );

			const item = screen.getByRole( 'menuitem', { name: 'Kitchen' } );
			// A Dashicon has no role or text to find it by.
			// eslint-disable-next-line testing-library/no-node-access
			const dashicon = item.querySelector( '.dashicons' );

			expect( dashicon ).toBeVisible();
			expect( dashicon ).toHaveClass( 'dashicons-editor-kitchensink' );
		} );
	} );
} );
