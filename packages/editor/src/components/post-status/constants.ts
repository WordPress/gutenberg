import { __ } from '@wordpress/i18n';

/**
 * The statuses the editor's status control offers, with the labels it shows
 * for them. Shared with code that names a core status outside the control.
 */
export const STATUS_OPTIONS = [
	{
		label: __( 'Draft' ),
		value: 'draft',
		description: __( 'Not ready to publish.' ),
	},
	{
		label: __( 'Pending' ),
		value: 'pending',
		description: __( 'Waiting for review before publishing.' ),
	},
	{
		label: __( 'Private' ),
		value: 'private',
		description: __( 'Only visible to site admins and editors.' ),
	},
	{
		label: __( 'Scheduled' ),
		value: 'future',
		description: __( 'Publish automatically on a chosen date.' ),
	},
	{
		label: __( 'Published' ),
		value: 'publish',
		description: __( 'Visible to everyone.' ),
	},
];
