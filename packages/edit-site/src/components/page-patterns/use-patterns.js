/**
 * External dependencies
 */
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
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
	templatePart,
} );

const selectTemplatePartsAsPatterns = createSelector(
	( select, categoryId, search = '' ) => {
		const { getEntityRecords, getIsResolving } = select( coreStore );
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

		const isResolving = getIsResolving( 'getEntityRecords', [
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
		select( coreStore ).getIsResolving( 'getEntityRecords', [
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

		return { patterns, isResolving: false };
	},
	( select ) => [
		select( coreStore ).getBlockPatterns(),
		unlock( select( editSiteStore ) ).getSettings(),
	]
);

const selectPatterns = createSelector(
	( select, categoryId, syncStatus, search = '' ) => {
		const { patterns: themePatterns } = selectThemePatterns( select );
		const { patterns: userPatterns } = selectUserPatterns( select );

		let patterns = [
			...( themePatterns || [] ),
			...( userPatterns || [] ),
		];

		if ( syncStatus ) {
			// User patterns can have their sync statuses checked directly
			// Non-user patterns are all unsynced for the time being.
			patterns = patterns.filter( ( pattern ) => {
				return pattern.id
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
		return { patterns, isResolving: false };
	},
	( select ) => [
		selectThemePatterns( select ),
		selectUserPatterns( select ),
	]
);

const selectUserPatterns = createSelector(
	( select, syncStatus, search = '' ) => {
		const { getIsResolving, getUserPatternCategories, getUserPatterns } =
			select( coreStore );

		let patterns = getUserPatterns();
		const userPatternCategories = getUserPatternCategories();
		const categories = new Map();
		userPatternCategories.forEach( ( userCategory ) =>
			categories.set( userCategory.id, userCategory )
		);

		const isResolving = getIsResolving( 'getUserPatterns' );

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
		select( coreStore ).getUserPatterns(),
		select( coreStore ).getIsResolving( 'getUserPatterns' ),
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
