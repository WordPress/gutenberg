/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

/**
 * External dependencies
 */
import memoize from 'memize';

const defaultTemplates = [
	{ name: 'About', content: '<!-- wp:paragraph {"align":"left"} --><p class="has-text-align-left">Visitors will want to know who is on the other side of the page. Use this space to write about yourself, your site, your business, or anything you want. Use the testimonials below to quote others, talking about the same thing – in their own words.</p><!-- /wp:paragraph -->' },
	{ name: 'Contact', content: '<!-- wp:paragraph {"align":"left"} --><p class="has-text-align-left">Let\'s talk 👋 Don\'t hesitate to reach out with the contact information below, or send a message using the form.</p><!-- /wp:paragraph -->' },
];

const parsedTemplates = memoize( () => defaultTemplates.map( template => ( {
	...template,
	blocks: parse( template.content ),
} ) ) );

export default parsedTemplates;
