/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import { PATTERN_CORE_SOURCES, PATTERN_TYPES } from '../../../utils/constants';
import { unlock } from '../../../lock-unlock';

function injectThemeAttributeInBlockTemplateContent(
	block,
	currentThemeStylesheet
) {
	block.innerBlocks = block.innerBlocks.map( ( innerBlock ) => {
		return injectThemeAttributeInBlockTemplateContent(
			innerBlock,
			currentThemeStylesheet
		);
	} );

	if (
		block.name === 'core/template-part' &&
		block.attributes.theme === undefined
	) {
		block.attributes.theme = currentThemeStylesheet;
	}
	return block;
}

function preparePatterns( patterns, template, currentThemeStylesheet ) {
	// Filter out duplicates.
	const filterOutDuplicatesByName = ( currentItem, index, items ) =>
		index === items.findIndex( ( item ) => currentItem.name === item.name );

	// Filter out core patterns.
	const filterOutCorePatterns = ( pattern ) =>
		! PATTERN_CORE_SOURCES.includes( pattern.source );

	// Filter only the patterns that are compatible with the current template.
	const filterCompatiblePatterns = ( pattern ) =>
		pattern.templateTypes?.includes( template.slug );

	return patterns
		.filter(
			filterOutCorePatterns &&
				filterOutDuplicatesByName &&
				filterCompatiblePatterns
		)
		.map( ( pattern ) => ( {
			...pattern,
			keywords: pattern.keywords || [],
			type: PATTERN_TYPES.theme,
			blocks: parse( pattern.content, {
				__unstableSkipMigrationLogs: true,
			} ).map( ( block ) =>
				injectThemeAttributeInBlockTemplateContent(
					block,
					currentThemeStylesheet
				)
			),
		} ) );
}

export function useAvailablePatterns( template ) {
	const { blockPatterns, restBlockPatterns, currentThemeStylesheet } =
		useSelect( ( select ) => {
			const { getSettings } = unlock( select( editSiteStore ) );
			const settings = getSettings();

			return {
				blockPatterns:
					settings.__experimentalAdditionalBlockPatterns ??
					settings.__experimentalBlockPatterns,
				restBlockPatterns: select( coreStore ).getBlockPatterns(),
				currentThemeStylesheet:
					select( coreStore ).getCurrentTheme().stylesheet,
			};
		}, [] );

	return useMemo( () => {
		const mergedPatterns = [
			...( blockPatterns || [] ),
			...( restBlockPatterns || [] ),
		];
		return preparePatterns(
			mergedPatterns,
			template,
			currentThemeStylesheet
		);
	}, [ blockPatterns, restBlockPatterns, template, currentThemeStylesheet ] );
}
