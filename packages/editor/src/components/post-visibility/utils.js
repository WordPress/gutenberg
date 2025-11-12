/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const VISIBILITY_OPTIONS = [
	{
		label: __( 'Public' ),
		value: 'public',
		description: __( 'Visible to everyone.' ),
	},
	{
		label: __( 'Private' ),
		value: 'private',
		description: __( 'Only visible to site admins and editors.' ),
	},
	{
		label: __( 'Password protected' ),
		value: 'password',
		description: __( 'Only visible to those who know the password.' ),
	},
];
