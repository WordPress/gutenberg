/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insert } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { formatListNumbered } from '@wordpress/icons';

const name = 'core/footnote';
const title = __( 'Footnote' );

export const footnote = {
	name,
	title,
	tagName: 'ruby',
	className: 'core-footnote',
	edit( { isActive, value, onChange, onFocus } ) {
		function onClick() {
			const newValue = insert( value, '[# ]' );
			newValue.start -= 1;
			newValue.end -= 1;
			onChange( newValue );
			onFocus();
		}

		return (
			<RichTextToolbarButton
				icon={ formatListNumbered }
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
			/>
		);
	},
};
