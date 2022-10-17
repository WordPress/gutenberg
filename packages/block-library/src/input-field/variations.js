/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'text',
		title: __( 'Text input' ),
		description: __( 'Plain text input field.' ),
		attributes: { type: 'text' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes?.type || blockAttributes?.type === 'text',
	},
	{
		name: 'textarea',
		title: __( 'Textarea input' ),
		description: __( 'Textarea input field.' ),
		attributes: { type: 'textarea' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'textarea',
	},
	{
		name: 'checkbox',
		title: __( 'Checkbox input' ),
		description: __( 'Checkbox input field.' ),
		attributes: { type: 'checkbox' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'checkbox',
	},
	{
		name: 'email',
		title: __( 'Email input' ),
		description: __( 'Email input field.' ),
		attributes: { type: 'email' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'email',
	},
	{
		name: 'url',
		title: __( 'URL input' ),
		description: __( 'URL input field.' ),
		attributes: { type: 'url' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'url',
	},
	{
		name: 'tel',
		title: __( 'Telephone input' ),
		description: __( 'Telephone input field.' ),
		attributes: { type: 'tel' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'tel',
	},
	{
		name: 'number',
		title: __( 'Number input' ),
		description: __( 'Number input field.' ),
		attributes: { type: 'number' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'number',
	},
	{
		name: 'submit',
		title: __( 'Submit button' ),
		attributes: { type: 'submit' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'submit',
	},
];

export default variations;
