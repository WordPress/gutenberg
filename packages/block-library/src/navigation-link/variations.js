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
const variations = [
	{
		name: 'link',
		isDefault: true,
		title: __( 'Link' ),
		description: __( 'A link to a URL.' ),
		attributes: {},
	},
	{
		name: 'post',
		icon: postIcon,
		title: __( 'Post Link' ),
		description: __( 'A link to a post.' ),
		attributes: { type: 'post' },
	},
	{
		name: 'page',
		icon: pageIcon,
		title: __( 'Page Link' ),
		description: __( 'A link to a page.' ),
		attributes: { type: 'page' },
	},
	{
		name: 'category',
		icon: categoryIcon,
		title: __( 'Category Link' ),
		description: __( 'A link to a category.' ),
		attributes: { type: 'category' },
	},
	{
		name: 'tag',
		icon: tagIcon,
		title: __( 'Tag Link' ),
		description: __( 'A link to a tag.' ),
		attributes: { type: 'tag' },
	},
];

/**
 * Add `isActive` function to all `navigation link` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) return;
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.type === variationAttributes.type;
} );

export default variations;
