/**
 * WordPress dependencies
 */
import { siteLogo } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export default {
	name: 'core/site-preview',
	title: __( 'Site preview' ),
	description: __( 'Shows preview of the site homepage.' ),
	icon: siteLogo,
};
