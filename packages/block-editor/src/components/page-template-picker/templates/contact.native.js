/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const Contact = {
	// translators: title for "Contact" page template
	name: __( 'Contact' ),
	key: 'contact',
	icon: '📫',
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
};

export default Contact;
