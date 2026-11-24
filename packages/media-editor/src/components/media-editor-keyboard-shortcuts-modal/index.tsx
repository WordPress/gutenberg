import type { ComponentProps } from 'react';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { KeyboardShortcut } from '@wordpress/ui';

type ShortcutEntry = {
	description: string;
} & ComponentProps< typeof KeyboardShortcut >;

const SHORTCUTS: ShortcutEntry[] = [
	{
		description: __( 'Undo' ),
		keyCombination: { modifier: 'primary', character: 'z' },
	},
	{
		description: __( 'Redo' ),
		keyCombination: { modifier: 'primaryShift', character: 'z' },
	},
	{
		description: __( 'Pan' ),
		keyCombination: {
			character: [ '↑', '↓', '←', '→' ],
		},
		label: __( 'Arrow keys' ),
	},
	{
		description: __( 'Zoom in' ),
		keyCombination: { character: '+' },
	},
	{
		description: __( 'Zoom out' ),
		keyCombination: { character: '-' },
	},
	{
		description: __( 'Rotate 90° clockwise' ),
		keyCombination: { character: 'R' },
	},
	{
		description: __( 'Rotate 90° counter-clockwise' ),
		keyCombination: { modifier: 'shift', character: 'R' },
	},
	{
		description: __( 'Flip horizontal' ),
		keyCombination: { character: 'H' },
	},
	{
		description: __( 'Flip vertical' ),
		keyCombination: { character: 'V' },
	},
	{
		description: __( 'Pan or resize crop (large step)' ),
		keyCombination: {
			modifier: 'shift',
			character: [ '↑', '↓', '←', '→' ],
		},
		label: __( 'Shift + Arrow keys' ),
	},
];

interface MediaEditorKeyboardShortcutsModalProps {
	onClose: () => void;
}

export default function MediaEditorKeyboardShortcutsModal( {
	onClose,
}: MediaEditorKeyboardShortcutsModalProps ) {
	return (
		<Modal
			className="media-editor-keyboard-shortcuts-modal"
			title={ __( 'Keyboard shortcuts' ) }
			onRequestClose={ onClose }
		>
			<p className="media-editor-keyboard-shortcuts-modal__note">
				{ __(
					'These shortcuts work when the image editor has focus.'
				) }
			</p>
			{ /*
			 * Disable reason: The `list` ARIA role is redundant but
			 * Safari+VoiceOver won't announce the list otherwise.
			 */ }
			{ /* eslint-disable jsx-a11y/no-redundant-roles */ }
			<ul
				className="media-editor-keyboard-shortcuts-modal__shortcut-list"
				role="list"
			>
				{ SHORTCUTS.map( ( { description, ...shortcut }, index ) => (
					<li
						key={ index }
						className="media-editor-keyboard-shortcuts-modal__shortcut"
					>
						<span className="media-editor-keyboard-shortcuts-modal__shortcut-description">
							{ description }
						</span>
						<KeyboardShortcut
							{ ...shortcut }
							className="media-editor-keyboard-shortcuts-modal__shortcut-term"
							keyClassName="media-editor-keyboard-shortcuts-modal__shortcut-key"
						/>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
		</Modal>
	);
}
