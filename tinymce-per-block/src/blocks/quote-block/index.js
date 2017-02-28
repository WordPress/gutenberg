/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import {
	EditorQuoteIcon,
} from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'quote', {
	title: 'Quote',
	form: form,
	icon: EditorQuoteIcon,
	controls: []
} );
