import { __ } from '@wordpress/i18n';
import { category as icon } from '@wordpress/icons';
import type { BlockConfiguration } from '@wordpress/blocks';
import type { CategoriesAttributes } from './types';

const variations: BlockConfiguration< CategoriesAttributes >[ 'variations' ] = [
	{
		name: 'terms',
		title: __( 'Terms List' ),
		icon,
		attributes: {
			// We need to set an attribute here that will be set when inserting the block.
			// We cannot leave this empty, as that would be interpreted as the default value,
			// which is `category` -- for which we're defining a distinct variation below,
			// for backwards compatibility reasons.
			// The logical fallback is thus the only other built-in and public taxonomy: Tags.
			taxonomy: 'post_tag',
		} as CategoriesAttributes,
		isActive: ( blockAttributes: CategoriesAttributes ) =>
			// This variation is used for any taxonomy other than `category`.
			blockAttributes.taxonomy !== 'category',
	},
	{
		name: 'categories',
		title: __( 'Categories List' ),
		description: __( 'Display a list of all categories.' ),
		icon,
		attributes: {
			taxonomy: 'category',
		} as CategoriesAttributes,
		isActive: [ 'taxonomy' ],
		// The following is needed to prevent "Terms List" from showing up twice in the inserter
		// (once for the block, once for the variation). Fortunately, it does not collide with
		// `categories` being the default value of the `taxonomy` attribute.
		isDefault: true,
	},
];

export default variations;
