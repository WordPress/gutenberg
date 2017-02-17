/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { FormatImageIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'image', {
	title: 'Image',
	icon: FormatImageIcon,
	form
} );
