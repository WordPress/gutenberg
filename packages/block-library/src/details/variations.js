/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';

const variations = [
	{
		name: 'details',
		title: __( 'Details' ),
		description: __(
			'An advanced block that allows displaying a summary and hiding and displaying detailed content.'
		),
		isDefault: true,
		scope: [ 'inserter' ],
		icon: chevronDown,
	},
	{
		name: 'transcript',
		title: __( 'Transcript' ),
		description: __(
			'A text transcript is an important type of alternative content for timed media, like audio and video.'
		),
		scope: [ 'inserter' ],
		icon: chevronDown,
	},
];

export default variations;
