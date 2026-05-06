/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	displayShortcutList,
	shortcutAriaLabel,
	type WPKeycodeModifier,
} from '@wordpress/keycodes';

interface KeyCombination {
	/** Modifier for cross-platform display (e.g. 'primary', 'primaryShift', 'shift'). */
	modifier?: WPKeycodeModifier;
	/** The key character(s) to display. Pass an array to render each as its own key. */
	character: string | string[];
	/** Optional aria-label override (used when character is a symbol). */
	ariaLabel?: string;
}

interface ShortcutEntry {
	description: string;
	keyCombination: KeyCombination;
}

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
			ariaLabel: __( 'Arrow keys' ),
		},
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
			ariaLabel: __( 'Shift + Arrow keys' ),
		},
	},
];

function KeyCombinationDisplay( {
	keyCombination,
}: {
	keyCombination: KeyCombination;
} ) {
	const { modifier, character, ariaLabel } = keyCombination;

	let keys: string[];
	if ( Array.isArray( character ) ) {
		if ( modifier ) {
			// Get the modifier prefix (e.g. ['⇧', '+']) from the first char,
			// then replace the last element with all the individual chars.
			const sample = displayShortcutList[ modifier ]( character[ 0 ] );
			keys = [ ...sample.slice( 0, -1 ), ...character ];
		} else {
			keys = character;
		}
	} else {
		keys = modifier
			? displayShortcutList[ modifier ]( character )
			: [ character ];
	}

	const charString = Array.isArray( character )
		? character.join( '' )
		: character;
	let label: string;
	if ( ariaLabel ) {
		label = ariaLabel;
	} else if ( modifier ) {
		label = shortcutAriaLabel[ modifier ]( charString );
	} else {
		label = charString;
	}

	return (
		<kbd
			className="media-editor-keyboard-shortcuts-modal__shortcut-term"
			aria-label={ label }
		>
			{ keys.map( ( key, index ) =>
				key === '+' && modifier ? (
					<Fragment key={ index }>{ key }</Fragment>
				) : (
					<kbd
						key={ index }
						className="media-editor-keyboard-shortcuts-modal__shortcut-key"
					>
						{ key }
					</kbd>
				)
			) }
		</kbd>
	);
}

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
				{ SHORTCUTS.map( ( { description, keyCombination }, index ) => (
					<li
						key={ index }
						className="media-editor-keyboard-shortcuts-modal__shortcut"
					>
						<span className="media-editor-keyboard-shortcuts-modal__shortcut-description">
							{ description }
						</span>
						<KeyCombinationDisplay
							keyCombination={ keyCombination }
						/>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
		</Modal>
	);
}
