/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { KeyboardShortcutHelpModal } from '../index';

const noop = () => {};

describe( 'KeyboardShortcutHelpModal', () => {
	it( 'should match snapshot when the modal is active', () => {
		render(
			<ShortcutProvider>
				<KeyboardShortcutHelpModal isModalActive toggleModal={ noop } />
			</ShortcutProvider>
		);

		expect(
			screen.getByRole( 'dialog', {
				name: 'Keyboard shortcuts',
			} )
		).toMatchSnapshot();
	} );

	it( 'should not render the modal when inactive', () => {
		render(
			<ShortcutProvider>
				<KeyboardShortcutHelpModal
					isModalActive={ false }
					toggleModal={ noop }
				/>
			</ShortcutProvider>
		);

		expect(
			screen.queryByRole( 'dialog', {
				name: 'Keyboard shortcuts',
			} )
		).not.toBeInTheDocument();
	} );
} );
