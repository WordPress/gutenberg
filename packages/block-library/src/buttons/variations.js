/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';

const variations = [
	{
		name: 'post-edit-link',
		title: __( 'Post Edit Link' ),
		description: __(
			'Displays a link to edit the current post for users with permission.'
		),
		className: 'wp-block-post-edit-link-wrapper',
		icon: pencil,
		scope: [ 'inserter' ],
		keywords: [ __( 'edit' ), __( 'edit post' ), __( 'edit link' ) ],
		innerBlocks: [
			[
				'core/button',
				{
					text: __( 'Edit Post' ),
					url: '#',
					rel: 'nofollow',
					metadata: {
						bindings: {
							url: {
								source: 'core/post-edit-url',
							},
						},
					},
				},
			],
		],
	},
];

export default variations;
