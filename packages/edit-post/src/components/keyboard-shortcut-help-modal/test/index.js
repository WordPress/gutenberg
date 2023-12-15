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
	it( 'should match snapshot when the modal is active', () => {
		render(
			<>
				<EditorKeyboardShortcutsRegister />
				<KeyboardShortcutHelpModal isModalActive toggleModal={ noop } />
			</>
		);

		expect(
			screen.getByRole( 'dialog', {
				name: 'Keyboard shortcuts',
			} )
		).toMatchSnapshot();
	} );

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
