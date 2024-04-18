/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useSelect, createSelector } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { filterOutDuplicatesByName } from './utils';
import {
	EXCLUDED_PATTERN_SOURCES,
	PATTERN_TYPES,
	PATTERN_SYNC_TYPES,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_ORIGINS,
	TEMPLATE_PART_AREA_DEFAULT_CATEGORY,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { searchItems } from './search-items';
import { store as editSiteStore } from '../../store';

const EMPTY_PATTERN_LIST = [];

const createTemplatePartId = ( theme, slug ) =>
	theme && slug ? theme + '//' + slug : null;

const templatePartToPattern = ( templatePart ) => ( {
	blocks: parse( templatePart.content.raw, {
		__unstableSkipMigrationLogs: true,
	} ),
	categories: [ templatePart.area ],
	description: templatePart.description || '',
	isCustom: templatePart.source === TEMPLATE_ORIGINS.custom,
	keywords: templatePart.keywords || [],
	id: createTemplatePartId( templatePart.theme, templatePart.slug ),
	name: createTemplatePartId( templatePart.theme, templatePart.slug ),
	title: decodeEntities( templatePart.title.rendered ),
	type: templatePart.type,
	_links: templatePart._links,
	templatePart,
} );

const selectTemplatePartsAsPatterns = createSelector(
	( select, categoryId, search = '' ) => {
		const { getEntityRecords, isResolving: isResolvingSelector } =
			select( coreStore );
		const { __experimentalGetDefaultTemplatePartAreas } =
			select( editorStore );
		const query = { per_page: -1 };
		const rawTemplateParts =
			getEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, query ) ??
			EMPTY_PATTERN_LIST;
		const templateParts = rawTemplateParts.map( ( templatePart ) =>
			templatePartToPattern( templatePart )
		);

		// In the case where a custom template part area has been removed we need
		// the current list of areas to cross check against so orphaned template
		// parts can be treated as uncategorized.
		const knownAreas = __experimentalGetDefaultTemplatePartAreas() || [];
		const templatePartAreas = knownAreas.map( ( area ) => area.area );

		const templatePartHasCategory = ( item, category ) => {
			if ( category !== TEMPLATE_PART_AREA_DEFAULT_CATEGORY ) {
				return item.templatePart.area === category;
			}

			return (
				item.templatePart.area === category ||
				! templatePartAreas.includes( item.templatePart.area )
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
		select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
	]
);

const selectThemePatterns = createSelector(
	( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		const { isResolving: isResolvingSelector } = select( coreStore );
		const settings = getSettings();
		const blockPatterns =
			settings.__experimentalAdditionalBlockPatterns ??
			settings.__experimentalBlockPatterns;

		const restBlockPatterns = select( coreStore ).getBlockPatterns();

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
			.map( ( pattern ) => ( {
				...pattern,
				keywords: pattern.keywords || [],
				type: PATTERN_TYPES.theme,
				blocks: parse( pattern.content, {
					__unstableSkipMigrationLogs: true,
				} ),
			} ) );
		return {
			patterns,
			isResolving: isResolvingSelector( 'getBlockPatterns' ),
		};
	},
	( select ) => [
		select( coreStore ).getBlockPatterns(),
		select( coreStore ).isResolving( 'getBlockPatterns' ),
		unlock( select( editSiteStore ) ).getSettings(),
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
			// User patterns can have their sync statuses checked directly
			// Non-user patterns are all unsynced for the time being.
			patterns = patterns.filter( ( pattern ) => {
				return pattern.type === PATTERN_TYPES.user
					? pattern.syncStatus === syncStatus
					: syncStatus === PATTERN_SYNC_TYPES.unsynced;
			} );
		}

		if ( categoryId ) {
			patterns = searchItems( patterns, search, {
				categoryId,
				hasCategory: ( item, currentCategory ) =>
					item.categories?.includes( currentCategory ),
			} );
		} else {
			patterns = searchItems( patterns, search, {
				hasCategory: ( item ) => ! item.hasOwnProperty( 'categories' ),
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

/**
 * Converts a post of type `wp_block` to a 'pattern item' that more closely
 * matches the structure of theme provided patterns.
 *
 * @param {Object} patternPost The `wp_block` record being normalized.
 * @param {Map}    categories  A Map of user created categories.
 *
 * @return {Object} The normalized item.
 */
const convertPatternPostToItem = ( patternPost, categories ) => ( {
	blocks: parse( patternPost.content.raw, {
		__unstableSkipMigrationLogs: true,
	} ),
	...( patternPost.wp_pattern_category.length > 0 && {
		categories: patternPost.wp_pattern_category.map(
			( patternCategoryId ) =>
				categories && categories.get( patternCategoryId )
					? categories.get( patternCategoryId ).slug
					: patternCategoryId
		),
	} ),
	termLabels: patternPost.wp_pattern_category.map( ( patternCategoryId ) =>
		categories?.get( patternCategoryId )
			? categories.get( patternCategoryId ).label
			: patternCategoryId
	),
	id: patternPost.id,
	name: patternPost.slug,
	syncStatus: patternPost.wp_pattern_sync_status || PATTERN_SYNC_TYPES.full,
	title: patternPost.title.raw,
	type: patternPost.type,
	patternPost,
} );

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
		let patterns = patternPosts
			? patternPosts.map( ( record ) =>
					convertPatternPostToItem( record, categories )
			  )
			: EMPTY_PATTERN_LIST;

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

export const usePatterns = (
	categoryType,
	categoryId,
	{ search = '', syncStatus } = {}
) => {
	return useSelect(
		( select ) => {
			if ( categoryType === TEMPLATE_PART_POST_TYPE ) {
				return selectTemplatePartsAsPatterns(
					select,
					categoryId,
					search
				);
			} else if ( categoryType === PATTERN_TYPES.theme ) {
				return selectPatterns( select, categoryId, syncStatus, search );
			} else if ( categoryType === PATTERN_TYPES.user ) {
				return selectUserPatterns( select, syncStatus, search );
			}
			return {
				patterns: EMPTY_PATTERN_LIST,
				isResolving: false,
			};
		},
		[ categoryId, categoryType, search, syncStatus ]
	);
};

export default usePatterns;
