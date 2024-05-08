/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { EXCLUDED_PATTERN_SOURCES, PATTERN_TYPES } =
	unlock( patternsPrivateApis );

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

/**
 * Filter all patterns and return only the ones that are compatible with the current template.
 *
 * @param {Array}  patterns An array of patterns.
 * @param {Object} template The current template.
 * @return {Array} Array of patterns that are compatible with the current template.
 */
function filterPatterns( patterns, template ) {
	// Filter out duplicates.
	const filterOutDuplicatesByName = ( currentItem, index, items ) =>
		index === items.findIndex( ( item ) => currentItem.name === item.name );

	// Filter out core/directory patterns not included in theme.json.
	const filterOutExcludedPatternSources = ( pattern ) =>
		! EXCLUDED_PATTERN_SOURCES.includes( pattern.source );

	// Looks for patterns that have the same template type as the current template,
	// or have a block type that matches the current template area.
	const filterCompatiblePatterns = ( pattern ) =>
		pattern.templateTypes?.includes( template.slug ) ||
		pattern.blockTypes?.includes( 'core/template-part/' + template.area );

	return patterns.filter( ( pattern, index, items ) => {
		return (
			filterOutDuplicatesByName( pattern, index, items ) &&
			filterOutExcludedPatternSources( pattern ) &&
			filterCompatiblePatterns( pattern )
		);
	} );
}

function preparePatterns( patterns, currentThemeStylesheet ) {
	return patterns.map( ( pattern ) => ( {
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
	const { blockPatterns, currentThemeStylesheet } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );

		return {
			blockPatterns: getSettings().__experimentalBlockPatterns,
			currentThemeStylesheet:
				select( coreStore ).getCurrentTheme().stylesheet,
		};
	}, [] );

	return useMemo( () => {
		const filteredPatterns = filterPatterns( blockPatterns, template );
		return preparePatterns(
			filteredPatterns,
			template,
			currentThemeStylesheet
		);
	}, [ blockPatterns, template, currentThemeStylesheet ] );
}
