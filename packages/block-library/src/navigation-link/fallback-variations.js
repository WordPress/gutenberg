/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	category as categoryIcon,
	page as pageIcon,
	postTitle as postIcon,
	tag as tagIcon,
} from '@wordpress/icons';

// FALLBACK: this is only used when the server does not understand the variations property in the
// register_block_type call. see navigation-link/index.php.
// Delete this file when supported WP ranges understand the `variations` property when passed to
// register_block_type in index.php.
const fallbackVariations = [
	{
		name: 'link',
		isDefault: true,
		title: __( 'Custom Link' ),
		description: __( 'A link to a custom URL.' ),
		attributes: {},
	},
	{
		name: 'post',
		icon: postIcon,
		title: __( 'Post Link' ),
		description: __( 'A link to a post.' ),
		attributes: { type: 'post', kind: 'post-type' },
	},
	{
		name: 'page',
		icon: pageIcon,
		title: __( 'Page Link' ),
		description: __( 'A link to a page.' ),
		attributes: { type: 'page', kind: 'post-type' },
	},
	{
		name: 'category',
		icon: categoryIcon,
		title: __( 'Category Link' ),
		description: __( 'A link to a category.' ),
		attributes: { type: 'category', kind: 'taxonomy' },
	},
	{
		name: 'tag',
		icon: tagIcon,
		title: __( 'Tag Link' ),
		description: __( 'A link to a tag.' ),
		attributes: { type: 'tag', kind: 'taxonomy' },
	},
];

/**
 * Add `isActive` function to all `navigation link` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
fallbackVariations.forEach( ( variation ) => {
	if ( variation.isActive ) return;
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.type === variationAttributes.type;
} );

export default fallbackVariations;
