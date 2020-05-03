/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const Portfolio = {
	// translators: title for "Portfolio" page template
	name: __( 'Portfolio' ),
	key: 'portfolio',
	icon: '🎨',
	content: [
		{
			name: 'core/paragraph',
			attributes: {
				align: 'left',
				// translators: sample content for "Portfolio" page template
				content: __(
					'My portfolio showcases various projects created throughout my career. See my contact information below and get in touch.'
				),
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
				align: 'left',
				// translators: sample content for "Portfolio" page template
				content: __( 'Project Name' ),
				level: 2,
			},
		},
		{
			name: 'core/gallery',
			attributes: {
				images: [
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/scatter-1.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/redcylinder-1.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/redbox.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/crab-1.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/cat.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/bluebox.jpg?w=640',
					},
				],
				caption: '',
				imageCrop: true,
				linkTo: 'none',
				sizeSlug: 'large',
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				align: 'left',
				// translators: sample content for "Portfolio" page template
				content: __(
					'A description of the project and the works presented.'
				),
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
		{
			name: 'core/spacer',
			attributes: {
				height: 24,
			},
		},
		{
			name: 'core/heading',
			attributes: {
				align: 'left',
				// translators: sample content for "Portfolio" page template
				content: __( 'Project Name' ),
				level: 2,
			},
		},
		{
			name: 'core/gallery',
			attributes: {
				images: [
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/scatter-1.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/redcylinder-1.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/redbox.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/crab-1.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/cat.jpg?w=640',
					},
					{
						url:
							'https://a8ctm1.files.wordpress.com/2019/08/bluebox.jpg?w=640',
					},
				],
				caption: '',
				imageCrop: true,
				linkTo: 'none',
				sizeSlug: 'large',
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				align: 'left',
				// translators: sample content for "Portfolio" page template
				content: __(
					'A description of the project and the works presented.'
				),
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
				// translators: sample content for "Portfolio" page template
				content: __( "Let's build something together." ),
				level: 2,
			},
		},
		{
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						url: '',
						// translators: sample content for "Portfolio" page template
						text: __( 'Get in touch!' ),
						linkTarget: '',
						rel: '',
						className: 'aligncenter',
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
			name: 'core/separator',
			attributes: {},
		},
	],
};

export default Portfolio;
