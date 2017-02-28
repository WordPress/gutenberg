/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import {
	EditorParagraphIcon,
} from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'paragraph', {
	title: 'Paragraph',
	form: form,
	icon: EditorParagraphIcon,
	controls: []
} );
