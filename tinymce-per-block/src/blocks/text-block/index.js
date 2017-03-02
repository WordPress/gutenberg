/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorTableIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'text', {
	title: 'Text',
	form: form,
	icon: EditorTableIcon,
} );
