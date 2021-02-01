/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postNavigationNext, postNavigationPrevious } from '@wordpress/icons';

const variations = [
	{
		isDefault: true,
		name: 'post-navigation-next',
		title: __( 'Next post link' ),
		description: __(
			'Displays the next post link that is adjacent to the current post.'
		),
		icon: postNavigationNext,
		attributes: { type: 'next' },
		scope: [ 'inserter', 'transform' ],
	},
	{
		name: 'post-navigation-previous',
		title: __( 'Previous post link' ),
		description: __(
			'Displays the previous post link that is adjacent to the current post.'
		),
		icon: postNavigationPrevious,
		attributes: { type: 'previous' },
		scope: [ 'inserter', 'transform' ],
	},
];

/**
 * Add `isActive` function to all `post-navigation` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) return;
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.type === variationAttributes.type;
} );

export default variations;
