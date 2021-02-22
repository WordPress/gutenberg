/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import {
	category,
	page,
	postTitle,
	tag,
	customPostType,
} from '@wordpress/icons';

function getIcon( variationName ) {
	switch ( variationName ) {
		case 'post':
			return postTitle;
		case 'page':
			return page;
		case 'tag':
			return tag;
		case 'category':
			return category;
		default:
			return customPostType;
	}
}

function enhanceNavigationLinkVariations( settings, name ) {
	if ( name !== 'core/navigation-link' ) {
		return settings;
	}

	if ( settings?.variations ) {
		const variations = settings.variations.map( ( variation ) => {
			return {
				...variation,
				...( ! variation.icon && {
					icon: getIcon( variation.name ),
				} ),
				...( ! variation.isActive && {
					isActive: ( blockAttributes, variationAttributes ) => {
						return (
							blockAttributes.type === variationAttributes.type
						);
					},
				} ),
			};
		} );
		return {
			...settings,
			variations,
		};
	}
	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/navigation-link',
	enhanceNavigationLinkVariations
);
