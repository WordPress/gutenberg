import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import DropdownMenu from '..';
import MenuItem from '../../menu-item';
import '../../button/style.scss';
import '../../dropdown/style.scss';
import '../../popover/style.scss';
import '../style.scss';

const menuItems = () => (
	<>
		<MenuItem>First item</MenuItem>
		<MenuItem>Last item</MenuItem>
	</>
);

describe( 'DropdownMenu opening focus', () => {
	it( 'focuses the menu on pointer opening and enters its first or last item with arrow keys', async () => {
		const user = userEvent.setup();
		const screen = await render(
			<DropdownMenu label="Open menu">{ menuItems }</DropdownMenu>
		);
		const toggle = screen.getByRole( 'button', { name: 'Open menu' } );
		const menu = screen.getByRole( 'menu', { name: 'Open menu' } );

		await user.click( toggle );
		await expect.element( menu ).toHaveFocus();
		await user.keyboard( '[ArrowDown]' );
		await expect
			.element( screen.getByRole( 'menuitem', { name: 'First item' } ) )
			.toHaveFocus();

		await user.keyboard( '[Escape]' );
		await expect.element( toggle ).toHaveFocus();
		await user.click( toggle );
		await expect.element( menu ).toHaveFocus();
		await user.keyboard( '[ArrowUp]' );
		await expect
			.element( screen.getByRole( 'menuitem', { name: 'Last item' } ) )
			.toHaveFocus();
	} );

	it.each( [ '[Enter]', '[Space]', '[ArrowDown]' ] )(
		'focuses the first item on keyboard opening with %s',
		async ( key ) => {
			const user = userEvent.setup();
			const screen = await render(
				<DropdownMenu label="Open menu">{ menuItems }</DropdownMenu>
			);

			await user.tab();
			await user.keyboard( key );
			await expect
				.element(
					screen.getByRole( 'menuitem', { name: 'First item' } )
				)
				.toHaveFocus();
		}
	);

	it( "preserves a consumer's custom focus target", async () => {
		const user = userEvent.setup();
		const screen = await render(
			<DropdownMenu
				label="Open menu"
				popoverProps={ {
					onFocusCapture: ( event ) => {
						if ( event.target === event.currentTarget ) {
							screen
								.getByRole( 'menuitem', { name: 'Last item' } )
								.element()
								.focus();
						}
					},
				} }
			>
				{ menuItems }
			</DropdownMenu>
		);

		await user.click( screen.getByRole( 'button', { name: 'Open menu' } ) );
		await expect
			.element( screen.getByRole( 'menuitem', { name: 'Last item' } ) )
			.toHaveFocus();
	} );
} );
