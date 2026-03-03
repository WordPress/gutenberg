/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { title } from '@wordpress/icons';
const variations = [
	{
		isDefault: true,
		name: 'archive-title',
		title: __( 'Archive Title' ),
		description: __(
			'Display the archive title based on the queried object.'
		),
		icon: title,
		attributes: {
			type: 'archive',
		},
		scope: [ 'inserter' ],
	},
	{
		isDefault: false,
		name: 'search-title',
		title: __( 'Search Results Title' ),
		description: __(
			'Display the search results title based on the queried object.'
		),
		icon: title,
		attributes: {
			type: 'search',
		},
		scope: [ 'inserter' ],
	},
	{
		isDefault: false,
		name: 'post-type-label',
		title: __( 'Post Type Label' ),
		description: __(
			'Display the post type label based on the queried object.'
		),
		icon: title,
		attributes: {
			type: 'post-type',
		},
		scope: [ 'inserter' ],
	},
];

/**
 * Add `isActive` function to all `query-title` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) {
		return;
	}
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.type === variationAttributes.type;
} );

export default variations;
