/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const widget = {
	apiVersion: 1,
	name: 'core/welcome',
	title: __( 'Welcome' ),
	description: __( 'A short widget description.' ),
	icon: 'wordpress',
	category: 'dashboard',
};

export default widget;
