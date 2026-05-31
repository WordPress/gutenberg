/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { audio } from '@wordpress/icons';

/**
 * Widget type definition
 */
export default {
	name: 'core/hello-dolly',
	title: __( 'Hello Dolly' ),
	icon: audio,
};
