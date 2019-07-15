/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat, remove, applyFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';

const name = 'core/code';
const title = __( 'Inline Code' );

export const code = {
	name,
	title,
	tagName: 'code',
	className: null,
	__unstableInputRule( value ) {
		const BACKTICK = '`';
		const { start, text } = value;
		const characterBefore = text.slice( start - 1, start );

		// Quick check the text for the necessary character.
		if ( characterBefore !== BACKTICK ) {
			return value;
		}

		const textBefore = text.slice( 0, start - 1 );
		const indexBefore = textBefore.lastIndexOf( BACKTICK );

		if ( indexBefore === -1 ) {
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
	edit( { value, onChange, isActive } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: name } ) );

		return (
			<RichTextToolbarButton
				icon="editor-code"
				title={ title }
				onClick={ onToggle }
				isActive={ isActive }
			/>
		);
	},
};
