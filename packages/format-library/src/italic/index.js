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
import { formatItalic } from '@wordpress/icons';

const name = 'core/italic';
const title = __( 'Italic' );

export const italic = {
	name,
	title,
	tagName: 'em',
	className: null,
	__unstableInputRule( value ) {
		const ASTERISK = '*';
		const DOUBLE_ASTERISK = '**';
		const UNDERSCORE = '_';
		const DOUBLE_UNDERSCORE = '__';
		const { start, text } = value;
		const characterBefore = text[ start - 1 ];

		// Quick check the text for the necessary character.
		if ( characterBefore !== ASTERISK && characterBefore !== UNDERSCORE ) {
			return value;
		}

		if ( start - 2 < 0 ) {
			return value;
		}

		const indexBefore = text.lastIndexOf( characterBefore, start - 2 );
		if ( indexBefore === -1 ) {
			return value;
		}

		// Check if the character before is a double asterisk or double underscore (see bold).
		const charactersBefore = text[ indexBefore ] + text[ indexBefore + 1 ];
		const charactersOffsetBefore =
			text[ indexBefore - 1 ] + text[ indexBefore ];

		if (
			charactersBefore === DOUBLE_ASTERISK ||
			charactersBefore === DOUBLE_UNDERSCORE ||
			charactersOffsetBefore === DOUBLE_ASTERISK ||
			charactersOffsetBefore === DOUBLE_UNDERSCORE
		) {
			return value;
		}

		const startIndex = indexBefore;
		const endIndex = start - 2;

		if ( startIndex === endIndex ) {
			return value;
		}

		value = remove( value, startIndex, startIndex + 1 );
		value = remove( value, endIndex, endIndex + 1 );
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
					character="i"
					onUse={ onToggle }
				/>
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
