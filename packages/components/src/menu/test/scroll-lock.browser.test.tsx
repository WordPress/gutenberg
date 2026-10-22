import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import { Menu } from '..';
import Modal from '../../modal';
// Load the body scroll-lock rule that WordPress enqueues for Modal.
import '../../modal/style.scss';

const MenuWithModal = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	return (
		<>
			<Menu>
				<Menu.TriggerButton>Open dropdown</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item onClick={ () => setIsModalOpen( true ) }>
						Open modal
					</Menu.Item>
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

describe( 'Menu scroll lock', () => {
	it.each( [ 'pointer', 'keyboard' ] )(
		'should keep body scroll locked when opening a modal with the %s and restore it after closing',
		async ( interaction ) => {
			const user = userEvent.setup();
			const initialOverflow = getComputedStyle( document.body ).overflow;
			expect( initialOverflow ).not.toBe( 'hidden' );
			await render( <MenuWithModal /> );

			if ( interaction === 'pointer' ) {
				await user.click(
					page.getByRole( 'button', { name: 'Open dropdown' } )
				);
			} else {
				await user.tab();
				await user.keyboard( '{ArrowDown}' );
			}

			await expect.element( page.getByRole( 'menu' ) ).toBeVisible();
			await expect
				.poll( () => getComputedStyle( document.body ).overflow )
				.toBe( 'hidden' );

			if ( interaction === 'pointer' ) {
				await user.click(
					page.getByRole( 'menuitem', { name: 'Open modal' } )
				);
			} else {
				await user.keyboard( '{Enter}' );
			}

			await expect
				.element( page.getByRole( 'menu' ) )
				.not.toBeInTheDocument();
			await expect.element( page.getByRole( 'dialog' ) ).toBeVisible();
			expect( getComputedStyle( document.body ).overflow ).toBe(
				'hidden'
			);

			if ( interaction === 'pointer' ) {
				await user.click(
					page.getByRole( 'button', { name: 'Close modal' } )
				);
			} else {
				await user.keyboard( '{Escape}' );
			}

			await expect
				.element( page.getByRole( 'dialog' ) )
				.not.toBeInTheDocument();
			await expect
				.poll( () => getComputedStyle( document.body ).overflow )
				.toBe( initialOverflow );
		}
	);
} );
