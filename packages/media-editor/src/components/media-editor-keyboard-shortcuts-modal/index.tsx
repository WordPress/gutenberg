/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

interface ShortcutEntry {
	keys: string[];
	description: string;
	keysAriaLabel?: string;
}

const SHORTCUTS: ShortcutEntry[] = [
	{
		keys: [ '↑', '↓', '←', '→' ],
		keysAriaLabel: __( 'Arrow keys' ),
		description: __( 'Pan' ),
	},
	{
		keys: [ '+' ],
		description: __( 'Zoom in' ),
	},
	{
		keys: [ '-' ],
		description: __( 'Zoom out' ),
	},
	{
		keys: [ 'R' ],
		description: __( 'Rotate 90° clockwise' ),
	},
	{
		keys: [ 'H' ],
		description: __( 'Flip horizontal' ),
	},
	{
		keys: [ 'V' ],
		description: __( 'Flip vertical' ),
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
			{ /* eslint-disable jsx-a11y/no-redundant-roles */ }
			<ul
				className="media-editor-keyboard-shortcuts-modal__shortcut-list"
				role="list"
			>
				{ SHORTCUTS.map( ( { keys, keysAriaLabel, description } ) => (
					<li
						key={ description }
						className="media-editor-keyboard-shortcuts-modal__shortcut"
					>
						<span className="media-editor-keyboard-shortcuts-modal__shortcut-description">
							{ description }
						</span>
						<kbd
							className="media-editor-keyboard-shortcuts-modal__shortcut-term"
							aria-label={ keysAriaLabel }
						>
							{ keys.map( ( key ) => (
								<kbd
									key={ key }
									className="media-editor-keyboard-shortcuts-modal__shortcut-key"
								>
									{ key }
								</kbd>
							) ) }
						</kbd>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
		</Modal>
	);
}
