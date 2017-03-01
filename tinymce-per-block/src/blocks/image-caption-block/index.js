/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import { FormatImageIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'imagecaption', {
	title: 'Image With Caption',
	icon: FormatImageIcon,
	form
} );
