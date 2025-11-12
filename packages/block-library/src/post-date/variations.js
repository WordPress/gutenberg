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
		isActive: ( blockAttributes ) => {
			const fieldValue =
				blockAttributes?.metadata?.bindings?.datetime?.args?.field ||
				blockAttributes?.metadata?.bindings?.datetime?.args?.key;
			return (
				blockAttributes?.metadata?.bindings?.datetime?.source ===
					'core/post-data' && fieldValue === 'date'
			);
		},
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
		isActive: ( blockAttributes ) => {
			const fieldValue =
				blockAttributes?.metadata?.bindings?.datetime?.args?.field ||
				blockAttributes?.metadata?.bindings?.datetime?.args?.key;
			return (
				blockAttributes?.metadata?.bindings?.datetime?.source ===
					'core/post-data' && fieldValue === 'modified'
			);
		},
		icon: postDate,
	},
];

export default variations;
