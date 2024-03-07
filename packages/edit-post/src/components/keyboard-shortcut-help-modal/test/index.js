/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { EditorKeyboardShortcutsRegister } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { KeyboardShortcutHelpModal } from '../index';

const noop = () => {};

describe( 'KeyboardShortcutHelpModal', () => {
	it( 'should not render the modal when inactive', () => {
		render(
			<>
				<EditorKeyboardShortcutsRegister />
				<KeyboardShortcutHelpModal
					isModalActive={ false }
					toggleModal={ noop }
				/>
			</>
		);

		expect(
			screen.queryByRole( 'dialog', {
				name: 'Keyboard shortcuts',
			} )
		).not.toBeInTheDocument();
	} );
} );
