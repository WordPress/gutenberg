/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Template option choices for predefined columns layouts.
 *
 * @type {WPBlockPattern[]}
 */
const patterns = [
	{
		name: 'media-left-equal',
		label: __( 'Media on left; equal split' ),
		icon: 'align-pull-left',
		isDefault: true,
		attributes: {
			mediaPosition: 'left',
			mediaWidth: 50,
		},
	},
	{
		name: 'media-left-one-third-two-thirds',
		label: __( 'Media on left; one-third, two-thirds split' ),
		icon: 'align-pull-left',
		attributes: {
			mediaPosition: 'left',
			mediaWidth: 33.33,
		},
	},
	{
		name: 'media-right-two-thirds-one-thirds',
		label: __( 'Media on right; two-thirds, one-third split' ),
		icon: 'align-pull-right',
		attributes: {
			mediaPosition: 'right',
			mediaWidth: 33.33,
		},
	},
	{
		name: 'media-right-equal',
		label: __( 'Media on right; equal split' ),
		icon: 'align-pull-right',
		attributes: {
			mediaPosition: 'right',
			mediaWidth: 50,
		},
	},
];

export default patterns;
