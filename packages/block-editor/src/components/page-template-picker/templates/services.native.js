/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const Services = {
	// translators: title for "Services" page template
	name: __( 'Services' ),
	key: 'services',
	icon: '🔧',
	content: [
		{
			name: 'core/paragraph',
			attributes: {
				// translators: sample content for "Services" page template
				content: __(
					"We offer a range of services to help you achieve the results you're after. Not sure what you need, or what it costs? We can explain what services are right for you and tell you more about our fees. Get in touch below."
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
			name: 'core/image',
			attributes: {
				url:
					'https://mgblayoutexamples.files.wordpress.com/2020/02/pexels-photo-3471423.jpg',
				alt: '',
				caption: '',
				sizeSlug: 'full',
				linkDestination: 'none',
			},
		},
		{
			name: 'core/heading',
			attributes: {
				// translators: sample content for "Services" page template
				content: __( 'Inspiration' ),
				level: 2,
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				// translators: sample content for "Services" page template
				content: __( 'A short description of the services you offer.' ),
			},
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 40,
			},
		},
		{
			name: 'core/image',
			attributes: {
				url:
					'https://mgblayoutexamples.files.wordpress.com/2020/02/pexels-photo-1595385.jpeg',
				alt: '',
				caption: '',
				sizeSlug: 'full',
				linkDestination: 'none',
			},
		},
		{
			name: 'core/heading',
			attributes: {
				// translators: sample content for "Services" page template
				content: __( 'Strategy' ),
				level: 2,
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				// translators: sample content for "Services" page template
				content: __( 'A short description of the services you offer.' ),
			},
		},
		{
			name: 'core/spacer',
			attributes: {
				height: 40,
			},
		},
		{
			name: 'core/image',
			attributes: {
				url:
					'https://mgblayoutexamples.files.wordpress.com/2020/02/pexels-photo-68562.jpg?w=1024',
				alt: '',
				caption: '',
				sizeSlug: 'large',
				linkDestination: 'none',
			},
		},
		{
			name: 'core/heading',
			attributes: {
				content: 'Focus',
				level: 2,
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				// translators: sample content for "Services" page template
				content: __( 'A short description of the services you offer.' ),
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
				// translators: sample content for "Services" page template
				content: __( 'Let’s Build Something Together' ),
				level: 2,
			},
		},
		{
			name: 'core/button',
			attributes: {
				// translators: sample content for "Services" page template
				text: __( 'Get in Touch' ),
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

export default Services;
