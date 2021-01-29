/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postsNavigationNext, postsNavigationPrevious } from '@wordpress/icons';

const variations = [
	{
		isDefault: true,
		name: 'posts-navigation-next',
		title: __( 'Next post link' ),
		description: __(
			'Displays the next post link that is adjacent to the current post.'
		),
		icon: postsNavigationNext,
		attributes: { type: 'next' },
		scope: [ 'inserter', 'transform' ],
	},
	{
		name: 'posts-navigation-previous',
		title: __( 'Previous post link' ),
		description: __(
			'Displays the previous post link that is adjacent to the current post.'
		),
		icon: postsNavigationPrevious,
		attributes: { type: 'previous' },
		scope: [ 'inserter', 'transform' ],
	},
];

/**
 * Add `isActive` function to all `posts-navigation` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) return;
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.type === variationAttributes.type;
} );

export default variations;
