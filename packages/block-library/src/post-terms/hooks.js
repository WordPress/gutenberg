/**
 * WordPress dependencies
 */
import { postCategories, postTerms } from '@wordpress/icons';

const variationIconMap = {
	category: postCategories,
	post_tag: postTerms,
};

// We add `icons` to categories and tags. The remaining ones use
// the block's default icon.
export default function enhanceVariations( settings, name ) {
	if ( name !== 'core/post-terms' ) {
		return settings;
	}
	const variations = settings.variations.map( ( variation ) => ( {
		...variation,
		...{
			icon: variationIconMap[ variation.name ] ?? postCategories,
		},
	} ) );
	return {
		...settings,
		variations,
	};
}
