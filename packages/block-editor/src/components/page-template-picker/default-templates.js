/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map } from 'lodash';
import memoize from 'memize';

const defaultTemplates = [
	{
		// translators: title for "About" page template
		name: __( 'About' ),
		icon: '👋',
		content: [
			{
				name: 'core/paragraph',
				attributes: {
					// translators: sample content for "About" page template
					content: __(
						'Visitors will want to know who is on the other side of the page. Use this space to write about yourself, your site, your business, or anything you want. Use the testimonials below to quote others, talking about the same thing – in their own words.'
					),
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					// translators: sample content for "About" page template
					content: __(
						'This is sample content, included with the template to illustrate its features. Remove or replace it with your own words and media.'
					),
				},
			},
			{
				name: 'core/heading',
				attributes: {
					// translators: sample content for "About" page template
					content: __( 'What People Say' ),
					level: 2,
				},
			},
			{
				name: 'core/quote',
				attributes: {
					// translators: sample content for "About" page template
					value: `<p>${ __(
						'The way to get started is to quit talking and begin doing.'
					) }</p>`,
					// translators: sample content for "About" page template
					citation: __( 'Walt Disney' ),
				},
			},
			{
				name: 'core/quote',
				attributes: {
					// translators: sample content for "About" page template
					value: `<p>${ __(
						'It is our choices, Harry, that show what we truly are, far more than our abilities.'
					) }</p>`,
					// translators: sample content for "About" page template
					citation: __( 'J.K. Rowling' ),
				},
			},
			{
				name: 'core/quote',
				attributes: {
					// translators: sample content for "About" page template
					value: `<p>${ __(
						'Don’t cry because it’s over, smile because it happened.'
					) }</p>`,
					// translators: sample content for "About" page template
					citation: __( 'Dr. Seuss' ),
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
					// translators: sample content for "About" page template
					content: __( 'Let’s build something together' ),
					level: 2,
				},
			},
			{
				name: 'core/button',
				attributes: {
					// translators: sample content for "About" page template
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
	},
	{
		// translators: title for "Contact" page template
		name: __( 'Contact' ),
		icon: '✉️',
		content: [
			{
				name: 'core/paragraph',
				attributes: {
					// translators: sample content for "Contact" page template
					content: __(
						"Let's talk 👋 Don't hesitate to reach out with the contact information below, or send a message using the form."
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
					// translators: sample content for "Contact" page template
					content: __( 'Get in Touch' ),
					level: 2,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					// translators: sample content for "Contact" page template
					content: __( '10 Street Road' ),
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					// translators: sample content for "Contact" page template
					content: __( 'City, 10100' ),
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					// translators: sample content for "Contact" page template
					content: __( 'USA' ),
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					// translators: sample content for "Contact" page template
					content: __(
						'<a href="mailto:mail@example.com">mail@example.com</a>'
					),
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					// translators: sample content for "Contact" page template
					content: __( '(555)555-1234' ),
				},
			},
		],
	},
	{
		// translators: title for "Portfolio" page template
		name: __( 'Portfolio' ),
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
							link:
								'https://a8ctm1.wordpress.com/portfolio/scatter-3/',
							id: '658',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/redcylinder-1.jpg?w=640',
							link:
								'https://a8ctm1.wordpress.com/portfolio/redcylinder-3/',
							id: '659',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/redbox.jpg?w=640',
							link:
								'https://a8ctm1.wordpress.com/portfolio/redbox-2/',
							id: '660',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/crab-1.jpg?w=640',
							link:
								'https://a8ctm1.wordpress.com/portfolio/crab-3/',
							id: '661',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/cat.jpg?w=640',
							link: 'https://a8ctm1.wordpress.com/portfolio/cat/',
							id: '662',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/bluebox.jpg?w=640',
							link:
								'https://a8ctm1.wordpress.com/portfolio/bluebox-2/',
							id: '663',
						},
					],
					ids: [ 658, 659, 660, 661, 662, 663 ],
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
							link:
								'https://a8ctm1.wordpress.com/portfolio/scatter-3/',
							id: '658',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/redcylinder-1.jpg?w=640',
							link:
								'https://a8ctm1.wordpress.com/portfolio/redcylinder-3/',
							id: '659',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/redbox.jpg?w=640',
							link:
								'https://a8ctm1.wordpress.com/portfolio/redbox-2/',
							id: '660',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/crab-1.jpg?w=640',
							link:
								'https://a8ctm1.wordpress.com/portfolio/crab-3/',
							id: '661',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/cat.jpg?w=640',
							link: 'https://a8ctm1.wordpress.com/portfolio/cat/',
							id: '662',
						},
						{
							url:
								'https://a8ctm1.files.wordpress.com/2019/08/bluebox.jpg?w=640',
							link:
								'https://a8ctm1.wordpress.com/portfolio/bluebox-2/',
							id: '663',
						},
					],
					ids: [ 658, 659, 660, 661, 662, 663 ],
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
	},
	{
		// translators: title for "Services" page template
		name: __( 'Services' ),
		icon: '💼',
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
					id: 45,
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
					id: 68,
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
					id: 70,
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
			{
				name: 'core/spacer',
				attributes: {
					height: 40,
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
	},
	{
		// translators: title for "Team" page template
		name: __( 'Team' ),
		icon: '👩🏻‍💻',
		content: [
			{
				name: 'core/paragraph',
				attributes: {
					align: 'left',
					// translators: sample content for "Team" page template
					content: __(
						'We are a small team of talented professionals with a wide range of skills and experience. We love what we do, and we do it with passion. We look forward to working with you.'
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
				name: 'core/media-text',
				attributes: {
					align: 'wide',
					mediaAlt: '',
					mediaPosition: 'left',
					mediaId: 622,
					mediaUrl:
						'https://a8ctm1.files.wordpress.com/2019/08/adult.jpg?w=640',
					mediaType: 'image',
					mediaWidth: 50,
					isStackedOnMobile: true,
				},
				innerBlocks: [
					{
						name: 'core/heading',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __( 'Sally Smith' ),
							level: 2,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: `<em>${ __(
								'Position or Job Title'
							) }</em>`,
							dropCap: false,
							customFontSize: 16,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __(
								'A short bio with personal history, key achievements, or an interesting fact.'
							),
							dropCap: false,
							customFontSize: 16,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __(
								'Email me: <a href="mailto:mail@example.com">mail@example.com</a>'
							),
							dropCap: false,
							customFontSize: 16,
						},
					},
				],
			},
			{
				name: 'core/media-text',
				attributes: {
					align: 'wide',
					mediaAlt: '',
					mediaPosition: 'right',
					mediaId: 621,
					mediaUrl:
						'https://a8ctm1.files.wordpress.com/2019/08/activity.jpg?w=640',
					mediaType: 'image',
					mediaWidth: 50,
					isStackedOnMobile: true,
				},
				innerBlocks: [
					{
						name: 'core/heading',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __( 'Juan Pérez' ),
							level: 2,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: `<em>${ __(
								'Position or Job Title'
							) }</em>`,
							dropCap: false,
							customFontSize: 16,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __(
								'A short bio with personal history, key achievements, or an interesting fact.'
							),
							dropCap: false,
							customFontSize: 16,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __(
								'Email me: <a href="mailto:mail@example.com">mail@example.com</a>'
							),
							dropCap: false,
							customFontSize: 16,
						},
					},
				],
			},
			{
				name: 'core/media-text',
				attributes: {
					align: 'wide',
					mediaAlt: '',
					mediaPosition: 'left',
					mediaId: 652,
					mediaUrl:
						'https://a8ctm1.files.wordpress.com/2019/08/corgi-1.jpg?w=640',
					mediaType: 'image',
					mediaWidth: 50,
					isStackedOnMobile: true,
				},
				innerBlocks: [
					{
						name: 'core/heading',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __( 'Samuel the Dog' ),
							level: 2,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: `<em>${ __(
								'Position or Job Title'
							) }</em>`,
							dropCap: false,
							customFontSize: 16,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __(
								'A short bio with personal history, key achievements, or an interesting fact.'
							),
							dropCap: false,
							customFontSize: 16,
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							align: 'left',
							// translators: sample content for "Team" page template
							content: __(
								'Email me: <a href="mailto:mail@example.com">mail@example.com</a>'
							),
							dropCap: false,
							customFontSize: 16,
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
					// translators: sample content for "Team" page template
					content: __( 'Want to work with us?' ),
					level: 2,
				},
			},
			{
				name: 'core/button',
				attributes: {
					url: '',
					// translators: sample content for "Team" page template
					text: __( 'Get in Touch!' ),
					borderRadius: 4,
					className: 'aligncenter',
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
	},
];

const createInnerBlocks = ( { name, attributes, innerBlocks } ) => {
	return createBlock(
		name,
		attributes,
		map( innerBlocks, createInnerBlocks )
	);
};

const createBlocks = ( template ) => {
	return template.map( ( { name, attributes, innerBlocks } ) => {
		return createBlock(
			name,
			attributes,
			map( innerBlocks, createInnerBlocks )
		);
	} );
};

const parsedTemplates = memoize( () =>
	defaultTemplates.map( ( template ) => ( {
		...template,
		blocks: createBlocks( template.content ),
	} ) )
);

export default parsedTemplates;
