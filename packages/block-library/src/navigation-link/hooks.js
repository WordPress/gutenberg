/**
 * WordPress dependencies
 */
import {
	category,
	page,
	postTitle,
	tag,
	customPostType,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import fallbackVariations from './fallback-variations';

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

export function enhanceNavigationLinkVariations( settings, name ) {
	if ( name !== 'core/navigation-link' ) {
		return settings;
	}

	// Fallback handling may be deleted after supported WP ranges understand the `variations`
	// property when passed to register_block_type in index.php.
	if ( ! settings.variations ) {
		return {
			...settings,
			variations: fallbackVariations,
		};
	}

	// Otherwise decorate server passed variations with an icon and isActive function.
	if ( settings.variations ) {
		const isActive = ( blockAttributes, variationAttributes ) => {
			return blockAttributes.type === variationAttributes.type;
		};
		const variations = settings.variations.map( ( variation ) => {
			return {
				...variation,
				...( ! variation.icon && {
					icon: getIcon( variation.name ),
				} ),
				...( ! variation.isActive && {
					isActive,
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
