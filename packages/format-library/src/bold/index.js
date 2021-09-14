/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	__unstableRichTextInputEvent,
} from '@wordpress/block-editor';
import { formatBold } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';

const name = 'core/bold';
const title = __( 'Bold' );

export const bold = {
	name,
	title,
	tagName: 'strong',
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
				description: __( 'Make the selected text bold.' ),
				keyCombination: {
					modifier: 'primary',
					character: 'b',
				},
			} );
		}, [ registerShortcut ] );

		return (
			<>
				<RichTextToolbarButton
					name="bold"
					icon={ formatBold }
					title={ title }
					onClick={ onClick }
					isActive={ isActive }
					shortcutType="primary"
					shortcutCharacter="b"
				/>
				<__unstableRichTextInputEvent
					inputType="formatBold"
					onInput={ onToggle }
				/>
			</>
		);
	},
};
