import { createHigherOrderComponent } from '@wordpress/compose';
import { createElement } from '@wordpress/element';
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

// The layout support adds its flow classes to every block that supports layout. Post Terms blocks without a saved layout must have the original markup if no layout is set for backwards compat.
export const withoutUnusedLayoutClasses = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		if ( props.name !== 'core/post-terms' || props.attributes.layout ) {
			return createElement( BlockListBlock, props );
		}
		return createElement( BlockListBlock, {
			...props,
			__unstableLayoutClassNames: undefined,
		} );
	},
	'withoutUnusedLayoutClasses'
);
