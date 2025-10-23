/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postDate } from '@wordpress/icons';

const variations = [
	{
		name: 'post-date',
		title: __( 'Post Date' ),
		description: __( "Display a post's publish date." ),
		attributes: {
			metadata: {
				bindings: {
					datetime: {
						source: 'core/post-data',
						args: { field: 'date' },
					},
				},
			},
		},
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes?.metadata?.bindings?.datetime?.source ===
				'core/post-data' &&
			blockAttributes?.metadata?.bindings?.datetime?.args?.field ===
				'date',
		icon: postDate,
	},
	{
		name: 'post-date-modified',
		title: __( 'Modified Date' ),
		description: __( "Display a post's last updated date." ),
		attributes: {
			metadata: {
				bindings: {
					datetime: {
						source: 'core/post-data',
						args: { field: 'modified' },
					},
				},
			},
			className: 'wp-block-post-date__modified-date',
		},
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes?.metadata?.bindings?.datetime?.source ===
				'core/post-data' &&
			blockAttributes?.metadata?.bindings?.datetime?.args?.field ===
				'modified',
		icon: postDate,
	},
];

export default variations;
