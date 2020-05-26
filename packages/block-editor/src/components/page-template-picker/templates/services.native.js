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
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/image',
							attributes: {
								url:
									'https://cldup.com/niJL8UbTZH-3000x3000.jpeg',
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
								content: __(
									'A short description of the services you offer.'
								),
							},
						},
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/image',
							attributes: {
								url:
									'https://cldup.com/NTV4PW_Xtw-3000x3000.jpeg',
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
								content: __(
									'A short description of the services you offer.'
								),
							},
						},
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
						{
							name: 'core/image',
							attributes: {
								url:
									'https://cldup.com/CL1KK71EsH-1200x1200.jpeg',
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
								content: __(
									'A short description of the services you offer.'
								),
							},
						},
					],
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
				content: __( 'Let’s build something together!' ),
				level: 2,
			},
		},
		{
			name: 'core/buttons',
			align: 'center',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						// translators: sample content for "Services" page template
						text: __( 'Get in Touch' ),
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

export default Services;
