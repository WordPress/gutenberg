/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const About = {
	// translators: title for "About" page template
	name: __( 'About' ),
	key: 'about',
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
			name: 'core/columns',
			innerBlocks: [
				{
					name: 'core/column',
					innerBlocks: [
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
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
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
					],
				},
				{
					name: 'core/column',
					innerBlocks: [
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
				// translators: sample content for "About" page template
				content: __( 'Let’s build something together!' ),
				level: 2,
			},
		},
		{
			name: 'core/buttons',
			"attributes": {
				"align": "center"
			},
			innerBlocks: [
				{
					name: 'core/button',
					attributes: {
						// translators: sample content for "About" page template
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

export default About;
