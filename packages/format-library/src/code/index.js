/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';

const name = 'core/code';
const title = __( 'Inline Code' );

export const code = {
	name,
	title,
	tagName: 'code',
	className: null,
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
