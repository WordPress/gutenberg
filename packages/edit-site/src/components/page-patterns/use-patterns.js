import { parse } from '@wordpress/blocks';
import { useSelect, createSelector } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { filterOutDuplicatesByName } from './utils';
import {
	EXCLUDED_PATTERN_SOURCES,
	PATTERN_TYPES,
	PATTERN_SYNC_TYPES,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_PART_AREA_DEFAULT_CATEGORY,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { searchItems } from './search-items';
import { store as editSiteStore } from '../../store';

const { isPatternCustomization, applyPatternCustomization } =
	unlock( patternsPrivateApis );

const EMPTY_PATTERN_LIST = [];

const selectTemplateParts = createSelector(
	( select, categoryId, search = '' ) => {
		const {
			getEntityRecords,
			getCurrentTheme,
			isResolving: isResolvingSelector,
		} = select( coreStore );

		const query = { per_page: -1 };
		const templateParts =
			getEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, query ) ??
			EMPTY_PATTERN_LIST;

		// In the case where a custom template part area has been removed we need
		// the current list of areas to cross check against so orphaned template
		// parts can be treated as uncategorized.
		const knownAreas = getCurrentTheme()?.default_template_part_areas || [];

		const templatePartAreas = knownAreas.map( ( area ) => area.area );

		const templatePartHasCategory = ( item, category ) => {
			if ( category !== TEMPLATE_PART_AREA_DEFAULT_CATEGORY ) {
				return item.area === category;
			}

			return (
				item.area === category ||
				! templatePartAreas.includes( item.area )
			);
		};

		const isResolving = isResolvingSelector( 'getEntityRecords', [
			'postType',
			TEMPLATE_PART_POST_TYPE,
			query,
		] );

		const patterns = searchItems( templateParts, search, {
			categoryId,
			hasCategory: templatePartHasCategory,
		} );

		return { patterns, isResolving };
	},
	( select ) => [
		select( coreStore ).getEntityRecords(
			'postType',
			TEMPLATE_PART_POST_TYPE,
			{
				per_page: -1,
			}
		),
		select( coreStore ).isResolving( 'getEntityRecords', [
			'postType',
			TEMPLATE_PART_POST_TYPE,
			{ per_page: -1 },
		] ),
		select( coreStore ).getCurrentTheme()?.default_template_part_areas,
	]
);

const selectPatternOverrides = ( select ) =>
	(
		select( coreStore ).getEntityRecords( 'postType', PATTERN_TYPES.user, {
			per_page: -1,
		} ) ?? EMPTY_PATTERN_LIST
	).filter( isPatternCustomization );

const selectThemePatterns = createSelector(
	( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		const { isResolving: isResolvingSelector } = select( coreStore );
		const settings = getSettings();
		const blockPatterns =
			settings.__experimentalAdditionalBlockPatterns ??
			settings.__experimentalBlockPatterns;

		const restBlockPatterns = select( coreStore ).getBlockPatterns();
		const customizations = selectPatternOverrides( select );

		const patterns = [
			...( blockPatterns || [] ),
			...( restBlockPatterns || [] ),
		]
			.filter(
				( pattern ) =>
					! EXCLUDED_PATTERN_SOURCES.includes( pattern.source )
			)
			.filter( filterOutDuplicatesByName )
			.filter( ( pattern ) => pattern.inserter !== false )
			.map( ( pattern ) => {
				// The edited copy of a registered pattern, when it exists, is
				// the source of its title and content.
				const resolved = applyPatternCustomization(
					pattern,
					customizations
				);
				return {
					...resolved,
					keywords: pattern.keywords || [],
					type: PATTERN_TYPES.theme,
					blocks: parse( resolved.content, {
						__unstableSkipMigrationLogs: true,
					} ),
				};
			} );
		return {
			patterns,
			isResolving: isResolvingSelector( 'getBlockPatterns' ),
		};
	},
	( select ) => [
		select( coreStore ).getBlockPatterns(),
		select( coreStore ).isResolving( 'getBlockPatterns' ),
		unlock( select( editSiteStore ) ).getSettings(),
		select( coreStore ).getEntityRecords( 'postType', PATTERN_TYPES.user, {
			per_page: -1,
		} ),
	]
);

const selectPatterns = createSelector(
	( select, categoryId, syncStatus, search = '' ) => {
		const {
			patterns: themePatterns,
			isResolving: isResolvingThemePatterns,
		} = selectThemePatterns( select );
		const {
			patterns: userPatterns,
			isResolving: isResolvingUserPatterns,
			categories: userPatternCategories,
		} = selectUserPatterns( select );

		let patterns = [
			...( themePatterns || [] ),
			...( userPatterns || [] ),
		];

		if ( syncStatus ) {
			// User patterns carry `wp_pattern_sync_status`; registered
			// patterns carry a `synced` flag.
			patterns = patterns.filter( ( pattern ) => {
				if ( pattern.type === PATTERN_TYPES.user ) {
					return (
						( pattern.wp_pattern_sync_status ||
							PATTERN_SYNC_TYPES.full ) === syncStatus
					);
				}
				return (
					( pattern.synced
						? PATTERN_SYNC_TYPES.full
						: PATTERN_SYNC_TYPES.unsynced ) === syncStatus
				);
			} );
		}

		if ( categoryId ) {
			patterns = searchItems( patterns, search, {
				categoryId,
				hasCategory: ( item, currentCategory ) => {
					if ( item.type === PATTERN_TYPES.user ) {
						return item.wp_pattern_category?.some(
							( catId ) =>
								userPatternCategories.find(
									( cat ) => cat.id === catId
								)?.slug === currentCategory
						);
					}
					return item.categories?.includes( currentCategory );
				},
			} );
		} else {
			patterns = searchItems( patterns, search, {
				hasCategory: ( item ) => {
					if ( item.type === PATTERN_TYPES.user ) {
						return (
							userPatternCategories?.length &&
							( ! item.wp_pattern_category?.length ||
								! item.wp_pattern_category?.some( ( catId ) =>
									userPatternCategories.find(
										( cat ) => cat.id === catId
									)
								) )
						);
					}

					return ! item.hasOwnProperty( 'categories' );
				},
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

const selectUserPatterns = createSelector(
	( select, syncStatus, search = '' ) => {
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
		);
		const userPatternCategories = getUserPatternCategories();
		const categories = new Map();
		userPatternCategories.forEach( ( userCategory ) =>
			categories.set( userCategory.id, userCategory )
		);
		// Edited copies of registered patterns are listed as the registered
		// pattern itself, not as user patterns.
		let patterns = ( patternPosts ?? EMPTY_PATTERN_LIST ).filter(
			( record ) => ! isPatternCustomization( record )
		);
		const isResolving = isResolvingSelector( 'getEntityRecords', [
			'postType',
			PATTERN_TYPES.user,
			query,
		] );

		if ( syncStatus ) {
			patterns = patterns.filter(
				( pattern ) =>
					pattern.wp_pattern_sync_status ||
					PATTERN_SYNC_TYPES.full === syncStatus
			);
		}

		patterns = searchItems( patterns, search, {
			// We exit user pattern retrieval early if we aren't in the
			// catch-all category for user created patterns, so it has
			// to be in the category.
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

export function useAugmentPatternsWithPermissions( patterns ) {
	const idsAndTypes = useMemo(
		() =>
			patterns
				?.filter( ( record ) => record.type !== PATTERN_TYPES.theme )
				.map( ( record ) => [ record.type, record.id ] ) ?? [],
		[ patterns ]
	);

	const permissions = useSelect(
		( select ) => {
			const { getEntityRecordPermissions } = unlock(
				select( coreStore )
			);
			return idsAndTypes.reduce( ( acc, [ type, id ] ) => {
				acc[ id ] = getEntityRecordPermissions( 'postType', type, id );
				return acc;
			}, {} );
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
	postType,
	categoryId,
	{ search = '', syncStatus } = {}
) => {
	return useSelect(
		( select ) => {
			if ( postType === TEMPLATE_PART_POST_TYPE ) {
				return selectTemplateParts( select, categoryId, search );
			} else if ( postType === PATTERN_TYPES.user && !! categoryId ) {
				const appliedCategory =
					categoryId === 'uncategorized' ? '' : categoryId;
				return selectPatterns(
					select,
					appliedCategory,
					syncStatus,
					search
				);
			} else if ( postType === PATTERN_TYPES.user ) {
				return selectUserPatterns( select, syncStatus, search );
			}
			return {
				patterns: EMPTY_PATTERN_LIST,
				isResolving: false,
			};
		},
		[ categoryId, postType, search, syncStatus ]
	);
};

export default usePatterns;
