/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { formInputIcon } from './icons.js';

const variations = [
	{
		name: 'text',
		title: __( 'Text Input' ),
		icon: formInputIcon,
		description: __( 'A generic text input.' ),
		attributes: { type: 'text' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes?.type || blockAttributes?.type === 'text',
	},
	{
		name: 'textarea',
		title: __( 'Textarea Input' ),
		icon: formInputIcon,
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
		title: __( 'Checkbox Input' ),
		description: __( 'A simple checkbox input.' ),
		icon: formInputIcon,
		attributes: { type: 'checkbox', inlineLabel: true },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'checkbox',
	},
	{
		name: 'email',
		title: __( 'Email Input' ),
		icon: formInputIcon,
		description: __( 'Used for email addresses.' ),
		attributes: { type: 'email' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'email',
	},
	{
		name: 'url',
		title: __( 'URL Input' ),
		icon: formInputIcon,
		description: __( 'Used for URLs.' ),
		attributes: { type: 'url' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'url',
	},
	{
		name: 'tel',
		title: __( 'Telephone Input' ),
		icon: formInputIcon,
		description: __( 'Used for phone numbers.' ),
		attributes: { type: 'tel' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'tel',
	},
	{
		name: 'number',
		title: __( 'Number Input' ),
		icon: formInputIcon,
		description: __( 'A numeric input.' ),
		attributes: { type: 'number' },
		isDefault: true,
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) => blockAttributes?.type === 'number',
	},
];

export default variations;
