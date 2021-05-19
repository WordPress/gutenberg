/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { formatStrikethrough } from '@wordpress/icons';

const name = 'core/strikethrough';
const title = __( 'Strikethrough' );

export const strikethrough = {
	name,
	title,
	tagName: 's',
	className: null,
	edit( { isActive, value, onChange, onFocus } ) {
		function onClick() {
			onChange( toggleFormat( value, { type: name } ) );
			onFocus();
		}

		return (
			<RichTextToolbarButton
				icon={ formatStrikethrough }
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
			/>
		);
	},
};
