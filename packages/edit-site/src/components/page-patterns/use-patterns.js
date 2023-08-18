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
import {
	CORE_PATTERN_SOURCES,
	PATTERNS,
	SYNC_TYPES,
	TEMPLATE_PARTS,
	USER_PATTERNS,
	filterOutDuplicatesByName,
} from './utils';
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
	isCustom: templatePart.source === 'custom',
	keywords: templatePart.keywords || [],
	id: createTemplatePartId( templatePart.theme, templatePart.slug ),
	name: createTemplatePartId( templatePart.theme, templatePart.slug ),
	title: decodeEntities( templatePart.title.rendered ),
	type: templatePart.type,
	templatePart,
} );

const selectTemplatePartsAsPatterns = (
	select,
	{ categoryId, search = '' } = {}
) => {
	const { getEntityRecords, getIsResolving } = select( coreStore );
	const { __experimentalGetDefaultTemplatePartAreas } = select( editorStore );
	const query = { per_page: -1 };
	const rawTemplateParts =
		getEntityRecords( 'postType', TEMPLATE_PARTS, query ) ??
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
		if ( category !== 'uncategorized' ) {
			return item.templatePart.area === category;
		}

		return (
			item.templatePart.area === category ||
			! templatePartAreas.includes( item.templatePart.area )
		);
	};

	const isResolving = getIsResolving( 'getEntityRecords', [
		'postType',
		'wp_template_part',
		query,
	] );

	const patterns = searchItems( templateParts, search, {
		categoryId,
		hasCategory: templatePartHasCategory,
	} );

	return { patterns, isResolving };
};

const selectThemePatterns = ( select, { categoryId, search = '' } = {} ) => {
	const { getSettings } = unlock( select( editSiteStore ) );
	const settings = getSettings();
	const blockPatterns =
		settings.__experimentalAdditionalBlockPatterns ??
		settings.__experimentalBlockPatterns;

	const restBlockPatterns = select( coreStore ).getBlockPatterns();

	let patterns = [
		...( blockPatterns || [] ),
		...( restBlockPatterns || [] ),
	]
		.filter(
			( pattern ) => ! CORE_PATTERN_SOURCES.includes( pattern.source )
		)
		.filter( filterOutDuplicatesByName )
		.filter( ( pattern ) => pattern.inserter !== false )
		.map( ( pattern ) => ( {
			...pattern,
			keywords: pattern.keywords || [],
			type: 'pattern',
			blocks: parse( pattern.content, {
				__unstableSkipMigrationLogs: true,
			} ),
		} ) );

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
};

const reusableBlockToPattern = ( reusableBlock ) => ( {
	blocks: parse( reusableBlock.content.raw, {
		__unstableSkipMigrationLogs: true,
	} ),
	categories: reusableBlock.wp_pattern,
	id: reusableBlock.id,
	name: reusableBlock.slug,
	syncStatus: reusableBlock.wp_pattern_sync_status || SYNC_TYPES.full,
	title: reusableBlock.title.raw,
	type: reusableBlock.type,
	reusableBlock,
} );

const selectUserPatterns = ( select, { search = '', syncStatus } = {} ) => {
	const { getEntityRecords, getIsResolving } = select( coreStore );

	const query = { per_page: -1 };
	const records = getEntityRecords( 'postType', USER_PATTERNS, query );

	let patterns = records
		? records.map( ( record ) => reusableBlockToPattern( record ) )
		: EMPTY_PATTERN_LIST;
	const isResolving = getIsResolving( 'getEntityRecords', [
		'postType',
		USER_PATTERNS,
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

	return { patterns, isResolving };
};

export const usePatterns = (
	categoryType,
	categoryId,
	{ search = '', syncStatus }
) => {
	return useSelect(
		( select ) => {
			if ( categoryType === TEMPLATE_PARTS ) {
				return selectTemplatePartsAsPatterns( select, {
					categoryId,
					search,
				} );
			} else if ( categoryType === PATTERNS ) {
				return selectThemePatterns( select, { categoryId, search } );
			} else if ( categoryType === USER_PATTERNS ) {
				return selectUserPatterns( select, { search, syncStatus } );
			}
			return { patterns: EMPTY_PATTERN_LIST, isResolving: false };
		},
		[ categoryId, categoryType, search, syncStatus ]
	);
};

export default usePatterns;
