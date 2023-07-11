/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'comment-form',
		title: __( 'Comment form' ),
		description: __( 'A comment form for posts and pages.' ),
		attributes: {
			action: '{SITE_URL}/wp-comments-post.php',
			method: 'post',
			anchor: 'comment-form',
		},
		isDefault: false,
		innerBlocks: [
			[
				'core/form-input',
				{
					type: 'text',
					name: 'author',
					label: __( 'Name' ),
					required: true,
				},
			],
			[
				'core/form-input',
				{
					type: 'email',
					name: 'email',
					label: __( 'Email' ),
					required: true,
				},
			],
			[
				'core/form-input',
				{
					type: 'textarea',
					name: 'comment',
					label: __( 'Comment' ),
					required: true,
				},
			],
			[ 'core/form-submit-button', {} ],
		],
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes?.type || blockAttributes?.type === 'text',
	},
];

export default variations;
