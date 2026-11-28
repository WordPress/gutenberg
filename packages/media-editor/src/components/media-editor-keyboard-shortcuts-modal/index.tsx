import { Modal } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	displayShortcutList,
	shortcutAriaLabel,
	type WPKeycodeModifier,
} from '@wordpress/keycodes';
import { VisuallyHidden } from '@wordpress/ui';

type KeyCombinationDisplayProps =
	| {
			keyCombination: {
				character: string;
				modifier?: WPKeycodeModifier | null;
			};
			label?: string;
	  }
	| {
			keyCombination: {
				character: string[];
				modifier?: WPKeycodeModifier | null;
			};
			label: string;
	  };

type ShortcutEntry = KeyCombinationDisplayProps & {
	description: string;
};

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

function KeyCombinationDisplay( {
	keyCombination,
	label,
}: KeyCombinationDisplayProps ) {
	const { character, modifier } = keyCombination;
	const normalizedModifier = modifier ?? 'undefined';
	const characters = Array.isArray( character ) ? character : [ character ];
	const formatted = displayShortcutList[ normalizedModifier ](
		characters[ 0 ] ?? ''
	);
	const prefix = formatted.slice( 0, -1 );
	const keys = Array.isArray( character )
		? [ ...prefix, ...character ]
		: formatted;

	return (
		<kbd
			className="media-editor-keyboard-shortcuts-modal__shortcut-term"
			dir="ltr"
		>
			<VisuallyHidden render={ <span /> }>
				{ label ||
					shortcutAriaLabel[ normalizedModifier ](
						characters.join( '' )
					) }
			</VisuallyHidden>
			<span aria-hidden="true">
				{ keys.map( ( key, keyIndex ) =>
					key === '+' && keyIndex < prefix.length ? (
						<Fragment key={ keyIndex }>{ key }</Fragment>
					) : (
						<kbd
							key={ keyIndex }
							className="media-editor-keyboard-shortcuts-modal__shortcut-key"
						>
							{ key }
						</kbd>
					)
				) }
			</span>
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
				{ SHORTCUTS.map( ( shortcut, index ) => (
					<li
						key={ index }
						className="media-editor-keyboard-shortcuts-modal__shortcut"
					>
						<span className="media-editor-keyboard-shortcuts-modal__shortcut-description">
							{ shortcut.description }
						</span>
						<KeyCombinationDisplay { ...shortcut } />
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
		</Modal>
	);
}
