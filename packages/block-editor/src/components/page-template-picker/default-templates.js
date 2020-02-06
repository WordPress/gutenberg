/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

/**
 * External dependencies
 */
import memoize from 'memize';

const defaultTemplates = [
	{
		name: 'About',
		icon: '👋',
		content: `
			<!-- wp:paragraph {"align":"left"} -->
			<p class="has-text-align-left">Visitors will want to know who is on the other side of the page. Use this space to write about yourself, your site, your business, or anything you want. Use the testimonials below to quote others, talking about the same thing – in their own words.</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph {"align":"left"} -->
			<p class="has-text-align-left">This is sample content, included with the template to illustrate its features. Remove or replace it with your own words and media.</p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"align":"center","level":3} -->
			<h3 class="has-text-align-center">What People Say</h3>
			<!-- /wp:heading -->

			<!-- wp:quote -->
			<blockquote class="wp-block-quote"><p>The way to get started is to quit talking and begin doing.</p><cite>Walt Disney</cite></blockquote>
			<!-- /wp:quote -->

			<!-- wp:quote -->
			<blockquote class="wp-block-quote"><p>It is our choices, Harry, that show what we truly are, far more than our abilities.</p><cite>J. K. Rowling</cite></blockquote>
			<!-- /wp:quote -->

			<!-- wp:quote -->
			<blockquote class="wp-block-quote"><p>Don't cry because it's over, smile because it happened.</p><cite>Dr. Seuss</cite></blockquote>
			<!-- /wp:quote -->

			<!-- wp:separator {"className":"is-style-wide"} -->
			<hr class="wp-block-separator is-style-wide"/>
			<!-- /wp:separator -->

			<!-- wp:heading {"align":"center"} -->
			<h2 class="has-text-align-center">Let’s build something together.</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"align":"center","textColor":"primary"} -->
			<p class="has-text-color has-text-align-center has-primary-color"><strong><a href="#">Get in touch!</a></strong></p>
			<!-- /wp:paragraph -->

			<!-- wp:separator {"className":"is-style-wide"} -->
			<hr class="wp-block-separator is-style-wide"/>
			<!-- /wp:separator -->
		`,
	},
	{
		name: 'Contact',
		icon: '✉️',
		content: `
			<!-- wp:paragraph {"align":"left"} -->
			<p class="has-text-align-left">Let's talk 👋 Don't hesitate to reach out with the contact information below, or send a message using the form.</p>
			<!-- /wp:paragraph -->

			<!-- wp:heading {"align":"left"} -->
			<h2 class="has-text-align-left">Get in Touch</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p>10 Street Road</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph -->
			<p>City,  10100</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph -->
			<p>USA</p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph -->
			<p><a href="mailto:mail@example.com">mail@example.com</a></p>
			<!-- /wp:paragraph -->

			<!-- wp:paragraph -->
			<p><a href="tel:5555551234">(555) 555 1234</a></p>
			<!-- /wp:paragraph -->
		`,
	},
];

const parsedTemplates = memoize( () =>
	defaultTemplates.map( ( template ) => ( {
		...template,
		blocks: parse( template.content ),
	} ) )
);

export default parsedTemplates;
