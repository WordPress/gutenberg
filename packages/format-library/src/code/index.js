/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat, remove, applyFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
} from '@wordpress/block-editor';
import { code as codeIcon } from '@wordpress/icons';

const name = 'core/code';
const title = __( 'Inline code' );

export const code = {
	name,
	title,
	tagName: 'code',
	className: null,
	__unstableInputRule( value ) {
		const BACKTICK = '`';
		const { start, text } = value;
		const characterBefore = text[ start - 1 ];

		// Quick check the text for the necessary character.
		if ( characterBefore !== BACKTICK ) {
			return value;
		}

		const searchStartIndex = start - 2;

		// First, try to find a backtick before (closing backtick scenario).
		if ( searchStartIndex >= 0 ) {
			const indexBefore = text.lastIndexOf( BACKTICK, searchStartIndex );

			if ( indexBefore !== -1 ) {
				const startIndex = indexBefore;
				const endIndex = searchStartIndex;

				if ( startIndex !== endIndex ) {
					value = remove( value, startIndex, startIndex + 1 );
					value = remove( value, endIndex, endIndex + 1 );
					value = applyFormat(
						value,
						{ type: name },
						startIndex,
						endIndex
					);

					return value;
				}
			}
		}

		// If not found before, try to find a backtick after (opening backtick scenario).
		const indexAfter = text.indexOf( BACKTICK, start );

		if ( indexAfter === -1 ) {
			return value;
		}

		const startIndex = start - 1;
		const endIndex = indexAfter;

		if ( startIndex === endIndex ) {
			return value;
		}

		// Remove closing backtick first (at higher index) to avoid index shifting issues
		value = remove( value, endIndex, endIndex + 1 );
		// Then remove opening backtick
		value = remove( value, startIndex, startIndex + 1 );
		// Apply format (note: endIndex - 1 because we removed the closing backtick first)
		value = applyFormat( value, { type: name }, startIndex, endIndex - 1 );

		return value;
	},
	edit( { value, onChange, onFocus, isActive } ) {
		function onClick() {
			onChange( toggleFormat( value, { type: name, title } ) );
			onFocus();
		}

		return (
			<>
				<RichTextShortcut
					type="access"
					character="x"
					onUse={ onClick }
				/>
				<RichTextToolbarButton
					icon={ codeIcon }
					title={ title }
					onClick={ onClick }
					isActive={ isActive }
					role="menuitemcheckbox"
				/>
			</>
		);
	},
};
