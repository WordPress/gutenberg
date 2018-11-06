/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { RichTextShortcut } from '@wordpress/editor';

const name = 'core/code';

export const code = {
	name,
	title: __( 'Code' ),
	match: {
		tagName: 'code',
	},
	edit( { value, onChange } ) {
		const onToggle = () => onChange( toggleFormat( value, { type: name } ) );

		return (
			<RichTextShortcut
				type="access"
				character="x"
				onUse={ onToggle }
			/>
		);
	},
};
