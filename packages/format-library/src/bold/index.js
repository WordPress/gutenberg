/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat, remove, applyFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
	__unstableRichTextInputEvent,
} from '@wordpress/block-editor';
import { formatBold } from '@wordpress/icons';

const name = 'core/bold';
const title = __( 'Bold' );

export const bold = {
	name,
	title,
	tagName: 'strong',
	className: null,
	__unstableInputRule( value ) {
		const ASTERISK = '**';
		const UNDERSCORE = '__';
		const { start, text } = value;
		const charactersBefore = text[ start - 2 ] + text[ start - 1 ];

		// Quick check the text for the necessary character.
		if (
			charactersBefore !== ASTERISK &&
			charactersBefore !== UNDERSCORE
		) {
			return value;
		}

		if ( start - 2 < 0 ) {
			return value;
		}

		const indexBefore = text.lastIndexOf( charactersBefore, start - 3 );
		if ( indexBefore === -1 ) {
			return value;
		}

		const startIndex = indexBefore;
		const endIndex = start - 3;

		if ( startIndex === endIndex ) {
			return value;
		}

		value = remove( value, startIndex, startIndex + 2 );
		value = remove( value, endIndex - 1, endIndex + 2 );
		value = applyFormat( value, { type: name }, startIndex, endIndex );

		return value;
	},
	edit( { isActive, value, onChange, onFocus } ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name, title } ) );
		}

		function onClick() {
			onChange( toggleFormat( value, { type: name } ) );
			onFocus();
		}

		return (
			<>
				<RichTextShortcut
					type="primary"
					character="b"
					onUse={ onToggle }
				/>
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
