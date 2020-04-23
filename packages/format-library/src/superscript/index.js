/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';

const name = 'core/superscript';
const title = __( 'Superscript' );

export const superscript = {
	name,
	title,
	tagName: 'sup',
	className: null,
	edit( { isActive, value, onChange, onFocus } ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name } ) );
		}

		function onClick() {
			onToggle();
			onFocus();
		}

		return (
			<RichTextToolbarButton
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
			/>
		);
	},
};
