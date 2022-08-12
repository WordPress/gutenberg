/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insert } from '@wordpress/rich-text';
import { RichTextShortcut } from '@wordpress/block-editor';
import { isAppleOS } from '@wordpress/keycodes';

const name = 'core/non-breaking-space';
const title = __( 'Non breaking space' );

export const nonBreakingSpace = {
	name,
	title,
	tagName: 'span',
	className: 'nbsp',
	edit( { value, onChange } ) {
		function addNonBreakingSpace() {
			onChange( insert( value, ' ' ) );
		}

		// Shift + Ctrl + Space shortcut is built in on the Mac.
		if ( isAppleOS() ) {
			return;
		}

		return (
			<RichTextShortcut
				type="primaryShift"
				character=" "
				onUse={ addNonBreakingSpace }
			/>
		);
	},
};
