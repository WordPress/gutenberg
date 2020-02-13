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
					align: 'center',
					// translators: sample content for "About" page template
					content: __( 'What People Say' ),
					level: 3,
				},
			},
			{
				name: 'core/quote',
				attributes: {
					// translators: sample content for "About" page template
					value:
						'<p>' +
						__(
							'The way to get started is to quit talking and begin doing.'
						) +
						'</p>',
					// translators: sample content for "About" page template
					citation: __( 'Walt Disney' ),
				},
			},
			{
				name: 'core/quote',
				attributes: {
					// translators: sample content for "About" page template
					value:
						'<p>' +
						__(
							'It is our choices, Harry, that show what we truly are, far more than our abilities.'
						) +
						'</p>',
					// translators: sample content for "About" page template
					citation: __( 'J. K. Rowling' ),
				},
			},
			{
				name: 'core/quote',
				attributes: {
					// translators: sample content for "About" page template
					value:
						'<p>' +
						__(
							"Don't cry because it's over, smile because it happened."
						) +
						'</p>',
					// translators: sample content for "About" page template
					citation: __( 'Dr. Seuss' ),
				},
			},
			{
				name: 'core/separator',
				attributes: {
					className: 'is-style-wide',
				},
			},
			{
				name: 'core/heading',
				attributes: {
					align: 'center',
					// translators: sample content for "About" page template
					content: __( 'Let’s build something together.' ),
					level: 2,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					align: 'center',
					// translators: sample content for "About" page template
					content:
						'<strong><a href="#">' +
						__( 'Get in touch!' ) +
						'</a></strong>',
					textColor: 'primary',
				},
			},
			{
				name: 'core/separator',
				attributes: {
					className: 'is-style-wide',
				},
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
					content: __( 'City,  10100' ),
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
					content: __(
						'<a href="tel:5555551234">(555) 555 1234</a>'
					),
					dropCap: false,
				},
			},
		],
	},
];

const createBlocks = ( template ) => {
	return template.map( ( { name, attributes, innerBlocks } ) => {
		return createBlock(
			name,
			attributes,
			map( innerBlocks, createBlocks )
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
