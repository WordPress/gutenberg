/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	__unstableRichTextInputEvent,
} from '@wordpress/block-editor';
import { formatItalic } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';

const name = 'core/italic';
const title = __( 'Italic' );

export const italic = {
	name,
	title,
	tagName: 'em',
	className: null,
	edit: function Edit( { isActive, value, onChange, onFocus } ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name } ) );
		}

		function onClick() {
			onToggle();
			onFocus();
		}

		const { registerShortcut } = useDispatch( keyboardShortcutsStore );

		useShortcut( name, ( event ) => {
			onToggle();
			event.preventDefault();
		} );
		useEffect( () => {
			registerShortcut( {
				name,
				category: 'text',
				description: __( 'Make the selected text italic.' ),
				keyCombination: {
					modifier: 'primary',
					character: 'i',
				},
			} );
		}, [ registerShortcut ] );

		return (
			<>
				<RichTextToolbarButton
					name="italic"
					icon={ formatItalic }
					title={ title }
					onClick={ onClick }
					isActive={ isActive }
					shortcutType="primary"
					shortcutCharacter="i"
				/>
				<__unstableRichTextInputEvent
					inputType="formatItalic"
					onInput={ onToggle }
				/>
			</>
		);
	},
};
