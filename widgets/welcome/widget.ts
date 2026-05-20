/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const widget = {
	apiVersion: 1,
	name: 'core/welcome',
	title: __( 'Welcome' ),
	description: __(
		'Displays a welcome panel to introduce users to WordPress.'
	),
	icon: 'wordpress',
	category: 'dashboard',
};

export default widget;
