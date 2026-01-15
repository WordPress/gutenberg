/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import RichTextEdit from './edit';

const richTextField: Field< any > = {
	id: 'rich-text',
	type: 'text',
	label: __( 'Rich Text' ),
	Edit: RichTextEdit,
};

/**
 * RichText field.
 */
export default richTextField;
