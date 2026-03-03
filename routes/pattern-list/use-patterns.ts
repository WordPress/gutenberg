/**
 * WordPress dependencies
 */
import { useSelect, createSelector } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { privateApis as patternPrivateApis } from '@wordpress/patterns';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { filterOutDuplicatesByName } from './utils';
import { unlock } from '../lock-unlock';

const {
	PATTERN_TYPES,
	PATTERN_SYNC_TYPES,
	EXCLUDED_PATTERN_SOURCES,
	PATTERN_DEFAULT_CATEGORY,
} = unlock( patternPrivateApis );

const { extractWords, getNormalizedSearchTerms, normalizeString } = unlock(
	blockEditorPrivateApis
);

/**
 * Type for theme patterns from the pattern registry.
 */
interface ThemePattern {
	name: string;
	title: string;
	content: string;
	description: string;
	source?: string;
	inserter?: boolean;
	keywords?: string[];
	categories?: string[];
	viewportWidth?: number;
	blockTypes?: string[];
	postTypes?: string[];
	templateTypes?: string[];
}

/**
 * Type for user patterns from wp_block post type.
 */
interface UserPattern {
	id: number;
	name: string;
	title: { raw: string; rendered?: string };
	content: { raw: string; rendered?: string };
	excerpt?: { raw: string; rendered?: string };
	description?: string;
	wp_pattern_sync_status?: string;
	wp_pattern_category?: number[];
	blocks?: any[];
}

/**
 * Unified pattern type after normalization.
 * All patterns have these properties after going through normalizers.
 */
export interface NormalizedPattern {
	// Required properties (normalized for both user and theme patterns)
	id: string;
	title: string;
	content: string;
	description: string;
	keywords: string[];
	type: string;
	categories: string[];
	syncStatus: string;
	blocks?: any[];
	// Internal property for permissions lookup (user patterns only)
	_recordId?: number;
}

/**
 * Type for pattern category.
 */
interface PatternCategory {
	id: number;
	name: string;
	label: string;
}

/**
 * Normalize theme pattern to unified structure.
 *
 * @param pattern Theme pattern object.
 * @return Normalized pattern object.
 */
function normalizeThemePattern( pattern: ThemePattern ): NormalizedPattern {
	return {
		id: pattern.name,
		title: pattern.title,
		content: pattern.content,
		keywords: pattern.keywords || [],
		type: PATTERN_TYPES.theme,
		// Normalize categories to always be an array of slugs
		categories: pattern.categories || [],
		// Theme patterns are always unsynced
		syncStatus: PATTERN_SYNC_TYPES.unsynced,
		description: pattern.description || '',
	};
}

/**
 * Normalize user pattern to unified structure.
 *
 * @param pattern               User pattern object.
 * @param userPatternCategories List of available user pattern categories.
 * @return Normalized pattern object.
 */
function normalizeUserPattern(
	pattern: UserPattern,
	userPatternCategories: PatternCategory[]
): NormalizedPattern {
	// Convert category IDs to slugs
	const categories: string[] = [];
	if (
		pattern.wp_pattern_category &&
		Array.isArray( pattern.wp_pattern_category )
	) {
		pattern.wp_pattern_category.forEach( ( catId: number ) => {
			const category = userPatternCategories?.find(
				( cat ) => cat.id === catId
			);
			if ( category ) {
				categories.push( category.name );
			}
		} );
	}

	const numericId = pattern.id;
	return {
		id: pattern.name || pattern.id.toString(),
		_recordId: numericId, // Keep numeric ID for permissions lookup
		keywords: [],
		type: PATTERN_TYPES.user,
		// Normalize categories to always be an array of slugs
		categories,
		// Normalize sync status
		syncStatus: pattern.wp_pattern_sync_status || PATTERN_SYNC_TYPES.full,
		title:
			typeof pattern.title === 'string'
				? pattern.title
				: pattern.title.raw,
		content:
			typeof pattern.content === 'string'
				? pattern.content
				: pattern.content.raw,
		description: pattern.excerpt?.raw || '',
		blocks: pattern.blocks,
	};
}

/**
 * Search configuration type.
 */
interface SearchConfig {
	categoryId?: string;
	hasCategory?: ( item: NormalizedPattern, categoryId: string ) => boolean;
	onlyFilterByCategory?: boolean;
}

/**
 * Remove matching terms from unmatched terms list.
 * @param unmatchedTerms   List of unmatched terms.
 * @param unprocessedTerms Unprocessed terms string.
 * @return Filtered unmatched terms.
 */
const removeMatchingTerms = (
	unmatchedTerms: string[],
	unprocessedTerms: string
): string[] => {
	return unmatchedTerms.filter(
		( term ) =>
			! getNormalizedSearchTerms( unprocessedTerms ).some(
				( unprocessedTerm: string ) => unprocessedTerm.includes( term )
			)
	);
};

/**
 * Get the search rank for a given pattern and search term.
 * @param item       Normalized pattern.
 * @param searchTerm Search term string.
 * @param config     Search configuration.
 * @return Search rank number.
 */
function getItemSearchRank(
	item: NormalizedPattern,
	searchTerm: string,
	config: SearchConfig
): number {
	const { categoryId, hasCategory, onlyFilterByCategory } = config;

	// Check if item matches the category filter
	let rank =
		categoryId === PATTERN_DEFAULT_CATEGORY ||
		( categoryId === 'my-patterns' && item.type === PATTERN_TYPES.user ) ||
		( hasCategory && hasCategory( item, categoryId || '' ) )
			? 1
			: 0;

	if ( ! rank || onlyFilterByCategory ) {
		return rank;
	}

	// Access pattern properties directly
	const normalizedSearchInput = normalizeString( searchTerm );
	const normalizedTitle = normalizeString( item.title );

	// Exact title matches get highest rank
	if ( normalizedSearchInput === normalizedTitle ) {
		rank += 30;
	} else if ( normalizedTitle.startsWith( normalizedSearchInput ) ) {
		rank += 20;
	} else {
		// Search in all text fields
		const terms = [
			item.id,
			item.title,
			item.description,
			...item.keywords,
		].join( ' ' );
		const normalizedSearchTerms = extractWords( normalizedSearchInput );
		const unmatchedTerms = removeMatchingTerms(
			normalizedSearchTerms,
			terms
		);

		if ( unmatchedTerms.length === 0 ) {
			rank += 10;
		}
	}

	return rank;
}

/**
 * Filter and search patterns.
 * @param items       List of normalized patterns.
 * @param searchInput Search input string.
 * @param config      Search configuration.
 *
 * @return Filtered and searched patterns.
 */
function searchItems(
	items: NormalizedPattern[] = [],
	searchInput = '',
	config: SearchConfig = {}
): NormalizedPattern[] {
	const normalizedSearchTerms = getNormalizedSearchTerms( searchInput );

	const onlyFilterByCategory =
		config.categoryId !== PATTERN_DEFAULT_CATEGORY &&
		! normalizedSearchTerms.length;
	const searchRankConfig = { ...config, onlyFilterByCategory };

	const threshold = onlyFilterByCategory ? 0 : 1;

	const rankedItems = items
		.map( ( item ) => {
			return [
				item,
				getItemSearchRank( item, searchInput, searchRankConfig ),
			] as [ NormalizedPattern, number ];
		} )
		.filter( ( [ , rank ] ) => rank > threshold );

	// If no search terms, no need to sort
	if ( normalizedSearchTerms.length === 0 ) {
		return rankedItems.map( ( [ item ] ) => item );
	}

	rankedItems.sort( ( [ , rank1 ], [ , rank2 ] ) => rank2 - rank1 );
	return rankedItems.map( ( [ item ] ) => item );
}

const selectThemePatterns = createSelector(
	( select ) => {
		const { getBlockPatterns } = select( coreStore );
		const { isResolving: isResolvingSelector } = select( coreStore );

		const restBlockPatterns = getBlockPatterns() as ThemePattern[];

		const patterns = ( restBlockPatterns || [] )
			.filter(
				( pattern ) =>
					! EXCLUDED_PATTERN_SOURCES.includes( pattern.source )
			)
			.filter( filterOutDuplicatesByName )
			.filter( ( pattern ) => pattern.inserter !== false )
			.map( normalizeThemePattern );
		return {
			patterns,
			isResolving: isResolvingSelector( 'getBlockPatterns' ),
		};
	},
	( select ) => [
		select( coreStore ).getBlockPatterns(),
		select( coreStore ).isResolving( 'getBlockPatterns' ),
	]
);

const selectUserPatterns = createSelector(
	( select, syncStatus = undefined, search = '' ) => {
		const {
			getEntityRecords,
			isResolving: isResolvingSelector,
			getUserPatternCategories,
		} = select( coreStore );

		const query = { per_page: -1 };
		const patternPosts = getEntityRecords(
			'postType',
			PATTERN_TYPES.user,
			query
		) as UserPattern[] | null;
		const userPatternCategories =
			getUserPatternCategories() as PatternCategory[];
		let patterns = ( patternPosts ?? [] ).map( ( pattern ) =>
			normalizeUserPattern( pattern, userPatternCategories )
		);
		const isResolving = isResolvingSelector( 'getEntityRecords', [
			'postType',
			PATTERN_TYPES.user,
			query,
		] );

		if ( syncStatus ) {
			patterns = patterns.filter(
				( pattern ) => pattern.syncStatus === syncStatus
			);
		}

		patterns = searchItems( patterns, search, {
			// We exit user pattern retrieval early if we aren't in the
			// catch-all category for user created patterns, so it has
			// to be in the category.
			categoryId: PATTERN_DEFAULT_CATEGORY,
			hasCategory: () => true,
		} );

		return {
			patterns,
			isResolving,
			categories: userPatternCategories,
		};
	},
	( select ) => [
		select( coreStore ).getEntityRecords( 'postType', PATTERN_TYPES.user, {
			per_page: -1,
		} ),
		select( coreStore ).isResolving( 'getEntityRecords', [
			'postType',
			PATTERN_TYPES.user,
			{ per_page: -1 },
		] ),
		select( coreStore ).getUserPatternCategories(),
	]
);

const selectPatterns = createSelector(
	( select, categoryId, syncStatus, search = '' ) => {
		const {
			patterns: themePatterns,
			isResolving: isResolvingThemePatterns,
		} = selectThemePatterns( select );
		const { patterns: userPatterns, isResolving: isResolvingUserPatterns } =
			selectUserPatterns( select );

		let patterns = [
			...( themePatterns || [] ),
			...( userPatterns || [] ),
		];

		if ( syncStatus ) {
			patterns = patterns.filter(
				( pattern ) => pattern.syncStatus === syncStatus
			);
		}

		if ( categoryId && categoryId !== PATTERN_DEFAULT_CATEGORY ) {
			patterns = searchItems( patterns, search, {
				categoryId,
				hasCategory: (
					item: NormalizedPattern,
					currentCategory: string
				) => {
					return item.categories?.includes( currentCategory );
				},
			} );
		} else {
			// Show all patterns (categoryId is PATTERN_DEFAULT_CATEGORY or undefined)
			patterns = searchItems( patterns, search, {
				categoryId: PATTERN_DEFAULT_CATEGORY,
				hasCategory: () => true,
			} );
		}
		return {
			patterns,
			isResolving: isResolvingThemePatterns || isResolvingUserPatterns,
		};
	},
	( select ) => [
		selectThemePatterns( select ),
		selectUserPatterns( select ),
	]
);

interface PermissionsMap {
	[ id: string ]: {
		delete?: boolean;
		update?: boolean;
	};
}

export function useAugmentPatternsWithPermissions(
	patterns: NormalizedPattern[]
) {
	const idsAndTypes: [ string, number | undefined, string ][] = useMemo(
		() =>
			patterns
				?.filter( ( record ) => record.type !== PATTERN_TYPES.theme )
				.map( ( record ) => [
					record.type,
					record._recordId,
					record.id,
				] ) ?? [],
		[ patterns ]
	);

	const permissions = useSelect(
		( select ) => {
			const { getEntityRecordPermissions } = unlock(
				select( coreStore )
			);
			return idsAndTypes.reduce(
				( acc: PermissionsMap, [ type, numericId, stringId ] ) => {
					acc[ stringId ] = getEntityRecordPermissions(
						'postType',
						type,
						numericId
					);
					return acc;
				},
				{} as PermissionsMap
			);
		},
		[ idsAndTypes ]
	);

	return useMemo(
		() =>
			patterns?.map( ( record ) => ( {
				...record,
				permissions: permissions?.[ record.id ] ?? {},
			} ) ) ?? [],
		[ patterns, permissions ]
	);
}

export const usePatterns = (
	postType: string | null,
	categoryId?: string,
	{ search = '', syncStatus }: { search?: string; syncStatus?: string } = {}
) => {
	return useSelect(
		( select ) => {
			if ( postType === PATTERN_TYPES.user ) {
				const result = selectUserPatterns( select, syncStatus, search );
				let { patterns } = result;

				// Apply category filtering if specified
				if ( categoryId && categoryId !== PATTERN_DEFAULT_CATEGORY ) {
					patterns = patterns.filter( ( pattern ) =>
						pattern.categories.includes( categoryId )
					);
				}

				return {
					patterns,
					isResolving: result.isResolving,
				};
			} else if ( postType === PATTERN_TYPES.theme ) {
				const result = selectThemePatterns( select );
				let { patterns } = result;

				// Apply category filtering if specified
				if ( categoryId && categoryId !== PATTERN_DEFAULT_CATEGORY ) {
					patterns = patterns.filter( ( pattern ) =>
						pattern.categories.includes( categoryId )
					);
				}

				// Apply search filtering
				patterns = searchItems( patterns, search, {
					categoryId: categoryId || PATTERN_DEFAULT_CATEGORY,
					hasCategory: () => true,
				} );

				return {
					patterns,
					isResolving: result.isResolving,
				};
			}
			// null postType means all patterns
			return selectPatterns( select, categoryId, syncStatus, search );
		},
		[ categoryId, postType, search, syncStatus ]
	);
};

export default usePatterns;
