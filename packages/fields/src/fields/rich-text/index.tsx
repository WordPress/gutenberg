/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

const richTextField: Field< any > = {
	id: 'rich-text',
	type: 'text',
	label: __( 'Rich Text' ),
	Edit: 'richtext',
};

/**
 * RichText field.
 */
export default richTextField;
