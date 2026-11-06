import { select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
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

/**
 * Block spacing only spaces terms apart in Flex and Grid layouts, so it is
 * turned off in the other layouts. The control is hidden and the layout hook
 * outputs no gap styles.
 *
 * @param {unknown} result    Value set by an earlier filter.
 * @param {string}  path      Setting path.
 * @param {string}  clientId  Block client ID.
 * @param {string}  blockName Block name.
 * @return {unknown} The setting value, or `null` to turn Block spacing off.
 */
export function hideBlockGapOutsideFlexAndGrid(
	result,
	path,
	clientId,
	blockName
) {
	if ( blockName !== 'core/post-terms' || path !== 'spacing.blockGap' ) {
		return result;
	}
	const layoutType =
		select( blockEditorStore ).getBlockAttributes( clientId )?.layout?.type;
	return [ 'flex', 'grid' ].includes( layoutType ) ? result : null;
}
