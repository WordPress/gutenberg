/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */

/**
 * Template option choices for predefined columns layouts.
 *
 * @type {WPBlockVariation[]}
 */
const variations = [
	{
		name: 'section',
		title: __( 'Section' ),
		attributes: {
			tagName: 'section',
		},
		scope: [ 'inserter' ],
	},
];

export default variations;
