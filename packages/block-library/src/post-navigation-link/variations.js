/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	postNavigationLinkNext,
	postNavigationLinkPrevious,
} from '@wordpress/icons';

const variations = [
	{
		isDefault: true,
		name: 'post-navigation-link-next',
		title: __( 'Next post link' ),
		description: __(
			'Displays the post link that follows the current post.'
		),
		icon: postNavigationLinkNext,
		attributes: { type: 'next' },
		scope: [ 'inserter', 'transform' ],
	},
	{
		name: 'post-navigation-link-previous',
		title: __( 'Previous post link' ),
		description: __(
			'Displays the post link that precedes the current post.'
		),
		icon: postNavigationLinkPrevious,
		attributes: { type: 'previous' },
		scope: [ 'inserter', 'transform' ],
	},
];

/**
 * Add `isActive` function to all `post-navigation-link` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) return;
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.type === variationAttributes.type;
} );

export default variations;
