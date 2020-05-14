/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const Blog = {
	// translators: title for "Blog" page template
	name: __( 'Blog' ),
	key: 'blog',
	icon: '📰',
	content: [
		{
			name: 'core/cover',
			attributes: {
				url:
					'https://mgblayoutexamples.files.wordpress.com/2020/02/people-woman-coffee-meeting.jpg',
			},
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						// translators: sample content for "Blog" page template
						content: __( 'Welcome to our new blog' ),
						level: 1,
					},
				},
			],
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/latest-posts',
			attributes: {},
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/separator',
			attributes: {},
		},
	],
};

export default Blog;
