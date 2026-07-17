import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import type { ReactNode } from 'react';
import { ShortcutButton } from '../index';
import * as Tooltip from '../../tooltip';

const SHORTCUT = {
	displayShortcut: '⌘S',
	ariaKeyShortcut: 'Meta+S',
	description: 'Command S',
};

function TestProvider( { children }: { children: ReactNode } ) {
	return <Tooltip.Provider delay={ 0 }>{ children }</Tooltip.Provider>;
}

describe( 'ShortcutButton', () => {
	it( 'forwards its ref and Button props', () => {
		const ref = createRef< HTMLButtonElement >();

		render(
			<ShortcutButton
				ref={ ref }
				shortcut={ SHORTCUT }
				type="submit"
				aria-pressed="true"
			>
				Save
			</ShortcutButton>
		);

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
		expect( ref.current ).toHaveAttribute( 'type', 'submit' );
		expect( ref.current ).toHaveAttribute( 'aria-pressed', 'true' );
	} );

	it( 'uses shortcut metadata and preserves an existing accessible description', () => {
		const externalDescriptionId = 'external-description';

		render(
			<>
				<span id={ externalDescriptionId }>Available offline.</span>
				<ShortcutButton
					aria-describedby={ externalDescriptionId }
					shortcut={ SHORTCUT }
				>
					Save
				</ShortcutButton>
			</>
		);

		const button = screen.getByRole( 'button', {
			name: 'Save',
			description: 'Available offline. Keyboard shortcut: Command S',
		} );
		const shortcutDescription = screen.getByText(
			'Keyboard shortcut: Command S'
		);

		expect( button ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );
		expect( button ).toHaveAttribute(
			'aria-describedby',
			`${ externalDescriptionId } ${ shortcutDescription.id }`
		);
		expect( shortcutDescription ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( shortcutDescription.tagName ).toBe( 'SPAN' );
		expect( button ).toContainElement( shortcutDescription );
	} );

	it( 'displays the shortcut as presentational LTR tooltip content on keyboard focus', async () => {
		const user = userEvent.setup();

		render(
			<TestProvider>
				<ShortcutButton shortcut={ SHORTCUT }>Save</ShortcutButton>
			</TestProvider>
		);

		const button = screen.getByRole( 'button', { name: 'Save' } );
		await user.tab();
		expect( button ).toHaveFocus();

		await waitFor( () => {
			expect( screen.getByText( '⌘S' ) ).toBeVisible();
		} );
		expect( screen.getByText( '⌘S' ) ).toHaveAttribute(
			'aria-hidden',
			'true'
		);
		expect( screen.getByText( '⌘S' ) ).toHaveAttribute( 'dir', 'ltr' );
	} );

	it( 'shows the tooltip when focusable while disabled', async () => {
		const user = userEvent.setup();

		render(
			<TestProvider>
				<ShortcutButton disabled shortcut={ SHORTCUT }>
					Save
				</ShortcutButton>
			</TestProvider>
		);

		const button = screen.getByRole( 'button', { name: 'Save' } );
		expect( button ).toBeEnabled();
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( button ).toHaveAttribute( 'aria-keyshortcuts', 'Meta+S' );

		await user.hover( button );
		await waitFor( () => {
			expect( screen.getByText( '⌘S' ) ).toBeVisible();
		} );
	} );

	it( 'does not show the tooltip when truly disabled', async () => {
		const user = userEvent.setup();

		render(
			<TestProvider>
				<ShortcutButton
					disabled
					focusableWhenDisabled={ false }
					shortcut={ SHORTCUT }
				>
					Save
				</ShortcutButton>
			</TestProvider>
		);

		const button = screen.getByRole( 'button', { name: 'Save' } );
		expect( button ).toBeDisabled();
		await user.hover( button );

		expect( screen.queryByText( '⌘S' ) ).not.toBeInTheDocument();
	} );
} );
