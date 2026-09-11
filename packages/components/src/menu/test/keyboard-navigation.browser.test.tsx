import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import { Menu } from '..';
import Modal from '../../modal';

const waitForFocusedMenu = () =>
	expect.element( page.getByRole( 'menu' ) ).toHaveFocus();

const waitForFocusedMenuItem = ( name: string ) =>
	expect.element( page.getByRole( 'menuitem', { name } ) ).toHaveFocus();

const waitForClosedMenu = () =>
	expect.element( page.getByRole( 'menu' ) ).not.toBeInTheDocument();

const MenuWithModal = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	return (
		<>
			<Menu>
				<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
				<Menu.Popover>
					<Menu>
						<Menu.SubmenuTriggerItem>
							Open submenu
						</Menu.SubmenuTriggerItem>
						<Menu.Popover>
							<Menu.Item onClick={ () => setIsModalOpen( true ) }>
								Open modal
							</Menu.Item>
						</Menu.Popover>
					</Menu>
				</Menu.Popover>
			</Menu>
			{ isModalOpen && (
				<Modal
					title="Modal"
					onRequestClose={ () => setIsModalOpen( false ) }
				>
					<button onClick={ () => setIsModalOpen( false ) }>
						Close modal
					</button>
				</Modal>
			) }
		</>
	);
};

describe( 'Menu keyboard navigation', () => {
	it( 'should focus the first item when initially open', async () => {
		expect.hasAssertions();
		await render(
			<Menu defaultOpen>
				<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item>Menu item 1</Menu.Item>
					<Menu.Item>Menu item 2</Menu.Item>
				</Menu.Popover>
			</Menu>
		);

		await waitForFocusedMenuItem( 'Menu item 1' );
	} );

	it( 'should open and focus the first item when pressing the arrow down key on the trigger', async () => {
		const user = userEvent.setup();
		await render(
			<Menu>
				<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item disabled>First item</Menu.Item>
					<Menu.Item>Second item</Menu.Item>
					<Menu.Item>Third item</Menu.Item>
				</Menu.Popover>
			</Menu>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'Open dropdown',
		} );
		await user.tab();
		expect( trigger ).toHaveFocus();
		await user.keyboard( '{ArrowDown}' );

		await waitForFocusedMenuItem( 'First item' );
	} );

	it( 'should close when pressing the escape key', async () => {
		const user = userEvent.setup();
		await render(
			<Menu>
				<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item>Menu item</Menu.Item>
				</Menu.Popover>
			</Menu>
		);

		const trigger = screen.getByRole( 'button', {
			name: 'Open dropdown',
		} );
		await user.click( trigger );
		await waitForFocusedMenu();
		await user.keyboard( '{Escape}' );

		await waitForClosedMenu();
		await expect
			.element( page.getByRole( 'button', { name: 'Open dropdown' } ) )
			.toHaveFocus();
	} );

	it( 'should return focus to the root trigger after a nested menu opens a modal', async () => {
		const user = userEvent.setup();
		await render( <MenuWithModal /> );

		const trigger = screen.getByRole( 'button', {
			name: 'Open dropdown',
		} );
		await user.click( trigger );
		await waitForFocusedMenu();
		await user.keyboard( '{ArrowDown}' );
		await waitForFocusedMenuItem( 'Open submenu' );
		await user.keyboard( '{ArrowRight}' );
		await waitForFocusedMenuItem( 'Open modal' );
		await user.keyboard( '{Enter}' );
		await waitForClosedMenu();
		await user.click(
			screen.getByRole( 'button', { name: 'Close modal' } )
		);

		await expect
			.element( page.getByRole( 'button', { name: 'Open dropdown' } ) )
			.toHaveFocus();
	} );

	it( 'should navigate menu items and subitems using the arrow, spacebar and enter keys', async () => {
		expect.hasAssertions();
		const user = userEvent.setup();
		await render(
			<Menu>
				<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item>Menu item 1</Menu.Item>
					<Menu.Item>Menu item 2</Menu.Item>
					<Menu>
						<Menu.SubmenuTriggerItem>
							Submenu trigger item
						</Menu.SubmenuTriggerItem>
						<Menu.Popover>
							<Menu.Item>Submenu item 1</Menu.Item>
							<Menu.Item>Submenu item 2</Menu.Item>
						</Menu.Popover>
					</Menu>
					<Menu.Item>Menu item 3</Menu.Item>
				</Menu.Popover>
			</Menu>
		);

		await user.tab();
		await user.keyboard( '{ArrowDown}' );
		await waitForFocusedMenuItem( 'Menu item 1' );

		for ( const name of [
			'Menu item 2',
			'Submenu trigger item',
			'Menu item 3',
			'Menu item 1',
		] ) {
			await user.keyboard( '{ArrowDown}' );
			await waitForFocusedMenuItem( name );
		}

		await user.keyboard( '{ArrowUp}' );
		await waitForFocusedMenuItem( 'Menu item 3' );
		await user.keyboard( '{ArrowUp}' );
		await waitForFocusedMenuItem( 'Submenu trigger item' );

		await user.keyboard( '{ArrowRight}' );
		await waitForFocusedMenuItem( 'Submenu item 1' );
		await user.keyboard( '{ArrowDown}' );
		await waitForFocusedMenuItem( 'Submenu item 2' );

		for ( const key of [ '{ArrowLeft}', '{Enter}', '{ArrowLeft}', ' ' ] ) {
			await user.keyboard( key );
			await waitForFocusedMenuItem(
				key === '{ArrowLeft}'
					? 'Submenu trigger item'
					: 'Submenu item 1'
			);
		}

		await user.keyboard( '{ArrowLeft}' );
		await waitForFocusedMenuItem( 'Submenu trigger item' );
	} );
} );
