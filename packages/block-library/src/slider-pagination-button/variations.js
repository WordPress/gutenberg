/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';

const variations = [
	{
		name: 'previous',
		title: __( 'Previous Slide' ),
		description: __( 'Navigate to the previous slide.' ),
		attributes: { type: 'previous' },
		icon: chevronLeft,
		isDefault: true,
		isActive: ( blockAttributes ) => blockAttributes.type === 'previous',
	},
	{
		name: 'next',
		title: __( 'Next Slide' ),
		description: __( 'Navigate to the next slide.' ),
		attributes: { type: 'next' },
		icon: chevronRight,
		isActive: ( blockAttributes ) => blockAttributes.type === 'next',
	},
];

export default variations;
