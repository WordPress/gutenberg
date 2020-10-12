/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { page } from '@wordpress/icons';

const variations = [
	{
		name: 'latest-pages',
		title: 'Latest Pages',
		icon: page,
		keywords: [ __( 'pages' ) ],
		description: __( 'Display a list of your most recent pages.' ),
		attributes: {
			query: { postType: 'page', order: 'desc', orderBy: 'date' },
		},
	},
];
export default variations;
