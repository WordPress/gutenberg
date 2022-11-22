/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'text',
		title: __( 'Text input' ),
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
		attributes: { type: 'checkbox' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'checkbox',
	},
	{
		name: 'email',
		title: __( 'Email input' ),
		description: __( 'Used for email addresses.' ),
		attributes: { type: 'email' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'email',
	},
	{
		name: 'url',
		title: __( 'URL input' ),
		description: __( 'Used for URLs.' ),
		attributes: { type: 'url' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'url',
	},
	{
		name: 'tel',
		title: __( 'Telephone input' ),
		description: __( 'Used for phone numbers.' ),
		attributes: { type: 'tel' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'tel',
	},
	{
		name: 'number',
		title: __( 'Number input' ),
		description: __( 'A numeric input.' ),
		attributes: { type: 'number' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'number',
	},
];

export default variations;
