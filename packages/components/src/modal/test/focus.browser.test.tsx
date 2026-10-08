import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import Modal from '../';
import type { ModalProps } from '../types';

const FocusMountDemo = ( {
	focusOnMount,
	children = (
		<>
			<p>Modal content</p>
			<a href="https://wordpress.org">First Focusable Content Element</a>
			<a href="https://wordpress.org">
				Another Focusable Content Element
			</a>
		</>
	),
	...props
}: Partial<
	Pick< ModalProps, 'focusOnMount' | 'children' | 'isDismissible' >
> ) => {
	const [ isShown, setIsShown ] = useState( false );
	return (
		<>
			<button onClick={ () => setIsShown( true ) }>Toggle Modal</button>
			{ isShown && (
				<Modal
					{ ...props }
					focusOnMount={ focusOnMount }
					title="Modal title"
					onRequestClose={ () => setIsShown( false ) }
				>
					{ children }
				</Modal>
			) }
		</>
	);
};

describe( 'Modal focus handling', () => {
	it( 'should focus the Modal dialog by default when `focusOnMount` prop is not provided', async () => {
		const user = userEvent.setup();
		await render( <FocusMountDemo /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Toggle Modal' } )
		);

		expect( screen.getByRole( 'dialog' ) ).toHaveFocus();
	} );

	it( 'should focus the Modal dialog when `true` passed as value for `focusOnMount` prop', async () => {
		const user = userEvent.setup();
		await render( <FocusMountDemo focusOnMount /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Toggle Modal' } )
		);

		expect( screen.getByRole( 'dialog' ) ).toHaveFocus();
	} );

	it( 'should focus the first focusable element in the contents (if found) when `firstContentElement` passed as value for `focusOnMount` prop', async () => {
		const user = userEvent.setup();
		await render( <FocusMountDemo focusOnMount="firstContentElement" /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Toggle Modal' } )
		);

		expect(
			screen.getByText( 'First Focusable Content Element' )
		).toHaveFocus();
	} );

	it( 'should focus the first element anywhere within the Modal when `firstElement` passed as value for `focusOnMount` prop', async () => {
		const user = userEvent.setup();
		await render( <FocusMountDemo focusOnMount="firstElement" /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Toggle Modal' } )
		);

		expect( screen.getByRole( 'button', { name: 'Close' } ) ).toHaveFocus();
	} );

	it( 'focuses the close button when content has no tabbable elements', async () => {
		const user = userEvent.setup();
		await render(
			<FocusMountDemo
				focusOnMount="firstContentElement"
				children={ null }
			/>
		);

		await user.tab();
		await user.keyboard( '{Enter}' );

		await expect
			.element( screen.getByRole( 'button', { name: 'Close' } ) )
			.toHaveFocus();
	} );

	it( 'focuses the dialog frame when the Modal has no tabbable elements', async () => {
		const user = userEvent.setup();
		await render(
			<FocusMountDemo
				focusOnMount="firstContentElement"
				isDismissible={ false }
			>
				<p>Modal content</p>
			</FocusMountDemo>
		);

		await user.tab();
		await user.keyboard( '{Enter}' );

		await expect.element( screen.getByRole( 'dialog' ) ).toHaveFocus();
	} );

	it( 'should not move focus when `false` passed as value for `focusOnMount` prop', async () => {
		const user = userEvent.setup();
		await render( <FocusMountDemo focusOnMount={ false } /> );

		const opener = screen.getByRole( 'button', {
			name: 'Toggle Modal',
		} );
		await user.click( opener );

		expect( opener ).toHaveFocus();
	} );
} );
