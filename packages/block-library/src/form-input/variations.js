/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';

const variations = [
	{
		name: 'text',
		title: __( 'Text input' ),
		icon: 'edit-page',
		description: __( 'A generic text input.' ),
		attributes: { type: 'text' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes?.type || blockAttributes?.type === 'text',
	},
	{
		name: 'textarea',
		title: __( 'Textarea input' ),
		icon: 'testimonial',
		description: __(
			'A textarea input to allow entering multiple lines of text.'
		),
		attributes: { type: 'textarea' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'textarea',
	},
	{
		name: 'checkbox',
		title: __( 'Checkbox input' ),
		description: __( 'A simple checkbox input.' ),
		icon: 'forms',
		attributes: { type: 'checkbox', inlineLabel: true },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'checkbox',
	},
	{
		name: 'email',
		title: __( 'Email input' ),
		icon: 'email',
		description: __( 'Used for email addresses.' ),
		attributes: { type: 'email' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'email',
	},
	{
		name: 'url',
		title: __( 'URL input' ),
		icon: 'admin-site',
		description: __( 'Used for URLs.' ),
		attributes: { type: 'url' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'url',
	},
	{
		name: 'tel',
		title: __( 'Telephone input' ),
		icon: 'phone',
		description: __( 'Used for phone numbers.' ),
		attributes: { type: 'tel' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'tel',
	},
	{
		name: 'number',
		title: __( 'Number input' ),
		icon: 'edit-page',
		description: __( 'A numeric input.' ),
		attributes: { type: 'number' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'number',
	},
	{
		name: 'hidden',
		title: __( 'Hidden input' ),
		icon: unseen,
		description: __(
			'A hidden input. Use it to add hidden data to form submissions.'
		),
		attributes: { type: 'hidden' },
		isDefault: false,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'hidden',
	},
];

export default variations;
