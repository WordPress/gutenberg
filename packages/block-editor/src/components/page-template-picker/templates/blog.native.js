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
			name: 'core/image',
			attributes: {
				url:
					'https://mgblayoutexamples.files.wordpress.com/2020/02/people-woman-coffee-meeting.jpg',
			},
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/heading',
			attributes: {
				// translators: sample content for "Blog" page template
				content: __( 'Latest Blog Posts' ),
				level: 2,
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
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/heading',
			attributes: {
				align: 'center',
				// translators: sample content for "Blog" page template
				content: __( 'Follow our Blog' ),
				level: 2,
			},
		},
		{
			name: 'core/button',
			attributes: {
				// translators: sample content for "Blog" page template
				text: __( 'Subscribe' ),
			},
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
