// import createTemplatePartPostData from '../utils/create-template-part-post-data';

/**
 * External dependencies
 */
import removeAccents from 'remove-accents';
import { paramCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Generates a template part Id based on slug and theme inputs.
 *
 * @param {string} theme the template part's theme.
 * @param {string} slug  the template part's slug
 * @return {string|null} the template part's Id.
 */
export function createTemplatePartId( theme, slug ) {
	return theme && slug ? theme + '//' + slug : null;
}

export function createTemplatePartPostData(
	area,
	blocks = [],
	title = __( 'Untitled Template Part' )
) {
	// Currently template parts only allow latin chars.
	// Fallback slug will receive suffix by default.
	const cleanSlug = paramCase( title ).replace( /[^\w-]+/g, '' );

	// If we have `area` set from block attributes, means an exposed
	// block variation was inserted. So add this prop to the template
	// part entity on creation. Afterwards remove `area` value from
	// block attributes.
	return {
		title,
		slug: cleanSlug,
		content: serialize( blocks ),
		// `area` is filterable on the server and defaults to `UNCATEGORIZED`
		// if provided value is not allowed.
		area,
	};
}

/**
 * Retrieves the available block patterns for the given area.
 *
 * @param {string} area         Template part area.
 * @param {string} rootClientId Root client id
 *
 * @return {Array} array of block patterns.
 */
export function useAlternativeBlockPatterns( area, rootClientId ) {
	return useSelect(
		( select ) => {
			const blockNameWithArea = area
				? `core/template-part/${ area }`
				: 'core/template-part';
			const { __experimentalGetPatternsByBlockTypes } =
				select( blockEditorStore );
			return __experimentalGetPatternsByBlockTypes(
				blockNameWithArea,
				rootClientId
			);
		},
		[ area, rootClientId ]
	);
}

/**
 * Retrieves the available template parts for the given area.
 *
 * @param {string}  area       Template part area.
 * @param {string?} excludedId Template part ID to exclude.
 *
 * @return {{ templateParts: Array, isResolving: boolean }} array of template parts.
 */
export function useAlternativeTemplateParts( area, excludedId ) {
	const { templateParts, isResolving } = useSelect( ( select ) => {
		const { getEntityRecords, isResolving: _isResolving } =
			select( coreStore );
		const query = { per_page: -1 };
		return {
			templateParts: getEntityRecords(
				'postType',
				'wp_template_part',
				query
			),
			isLoading: _isResolving( 'getEntityRecords', [
				'postType',
				'wp_template_part',
				query,
			] ),
		};
	}, [] );

	const filteredTemplateParts = useMemo( () => {
		if ( ! templateParts ) {
			return [];
		}
		return (
			templateParts.filter(
				( templatePart ) =>
					createTemplatePartId(
						templatePart.theme,
						templatePart.slug
					) !== excludedId &&
					( ! area ||
						'uncategorized' === area ||
						templatePart.area === area )
			) || []
		);
	}, [ templateParts, area ] );

	return {
		templateParts: filteredTemplateParts,
		isResolving,
	};
}

/**
 * Retrieves the template part area object.
 *
 * @param {string} area Template part area identifier.
 *
 * @return {{icon: Object, label: string, tagName: string}} Template Part area.
 */
export function useTemplatePartArea( area ) {
	return useSelect(
		( select ) => {
			// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
			// Blocks can be loaded into a *non-post* block editor.
			/* eslint-disable @wordpress/data-no-store-string-literals */
			const definedAreas =
				select(
					'core/editor'
				).__experimentalGetDefaultTemplatePartAreas();
			/* eslint-enable @wordpress/data-no-store-string-literals */

			const selectedArea = definedAreas?.find(
				( { area: candidateArea } ) => candidateArea === area
			);
			const defaultArea = definedAreas?.find(
				( { area: candidateArea } ) => candidateArea === 'uncategorized'
			);

			return {
				icon: selectedArea?.icon || defaultArea?.icon,
				label: selectedArea?.label || __( 'Template Part' ),
				tagName: selectedArea?.area_tag ?? 'div',
			};
		},
		[ area ]
	);
}

/**
 * Sanitizes the search input string.
 *
 * @param {string} input The search input to normalize.
 *
 * @return {string} The normalized search input.
 */
function normalizeSearchInput( input = '' ) {
	// Disregard diacritics.
	input = removeAccents( input );

	// Trim & Lowercase.
	input = input.trim().toLowerCase();

	return input;
}

/**
 * Get the search rank for a given pattern and a specific search term.
 *
 * @param {Object} pattern     Pattern to rank
 * @param {string} searchValue Search term
 * @return {number} A pattern search rank
 */
function getPatternSearchRank( pattern, searchValue ) {
	const normalizedSearchValue = normalizeSearchInput( searchValue );
	const normalizedTitle = normalizeSearchInput( pattern.title );

	let rank = 0;

	if ( normalizedSearchValue === normalizedTitle ) {
		rank += 30;
	} else if ( normalizedTitle.startsWith( normalizedSearchValue ) ) {
		rank += 20;
	} else {
		const searchTerms = normalizedSearchValue.split( ' ' );
		const hasMatchedTerms = searchTerms.every( ( searchTerm ) =>
			normalizedTitle.includes( searchTerm )
		);

		// Prefer pattern with every search word in the title.
		if ( hasMatchedTerms ) {
			rank += 10;
		}
	}

	return rank;
}

/**
 * Filters an pattern list given a search term.
 *
 * @param {Array}  patterns    Item list
 * @param {string} searchValue Search input.
 *
 * @return {Array} Filtered pattern list.
 */
export function searchPatterns( patterns = [], searchValue = '' ) {
	if ( ! searchValue ) {
		return patterns;
	}

	const rankedPatterns = patterns
		.map( ( pattern ) => {
			return [ pattern, getPatternSearchRank( pattern, searchValue ) ];
		} )
		.filter( ( [ , rank ] ) => rank > 0 );

	rankedPatterns.sort( ( [ , rank1 ], [ , rank2 ] ) => rank2 - rank1 );
	return rankedPatterns.map( ( [ pattern ] ) => pattern );
}
