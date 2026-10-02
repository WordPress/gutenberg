import { __ } from '@wordpress/i18n';

export const DEFAULT_VIEWS: {
	slug: string;
	label: string;
}[] = [
	{
		slug: 'all',
		label: __( 'All patterns' ),
	},
	{
		slug: 'my-patterns',
		label: __( 'My patterns' ),
	},
	{
		slug: 'registered',
		label: __( 'Registered' ),
	},
];
