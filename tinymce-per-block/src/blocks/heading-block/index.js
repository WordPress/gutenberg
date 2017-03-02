/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { EditorHeadingIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'heading', {
	title: 'Heading',
	form: form,
	icon: EditorHeadingIcon,
} );
