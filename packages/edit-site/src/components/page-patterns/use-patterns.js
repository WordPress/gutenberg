/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

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
	blocks: parse( templatePart.content.raw ),
	categories: [ templatePart.area ],
	description: templatePart.description || '',
	isCustom: templatePart.source === 'custom',
	keywords: templatePart.keywords || [],
	id: createTemplatePartId( templatePart.theme, templatePart.slug ),
	name: createTemplatePartId( templatePart.theme, templatePart.slug ),
	title: templatePart.title.rendered,
	type: templatePart.type,
	templatePart,
} );

const selectTemplatePartsAsPatterns = (
	select,
	{ categoryId, search = '', page = 1 } = {}
) => {
	const { getEntityRecords, getIsResolving, getEntityConfig } =
		select( coreStore );
	const query = {
		per_page: 20,
		page,
		area: categoryId,
		// TODO: The template parts REST API doesn't support searching yet.
		search,
		search_columns: 'post_title',
	};
	const templateParts =
		getEntityRecords( 'postType', TEMPLATE_PARTS, query ) ??
		EMPTY_PATTERN_LIST;
	const patterns = templateParts.map( ( templatePart ) =>
		templatePartToPattern( templatePart )
	);

	const isResolving = getIsResolving( 'getEntityRecords', [
		'postType',
		TEMPLATE_PARTS,
		query,
	] );

	const getTotalPages = async ( { signal } = {} ) => {
		const entityConfig = getEntityConfig( 'postType', TEMPLATE_PARTS );
		const response = await apiFetch( {
			path: addQueryArgs( entityConfig.baseURL, {
				...entityConfig.baseURLParams,
				...query,
			} ),
			method: 'HEAD',
			parse: false,
			signal,
		} );
		return parseInt( response.headers.get( 'X-WP-Totalpages' ), 10 );
	};

	return {
		patterns,
		isResolving,
		getTotalPages,
	};
};

const selectThemePatterns = (
	select,
	{ categoryId, search = '', page = 1 } = {}
) => {
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
		.map( ( pattern ) => ( {
			...pattern,
			keywords: pattern.keywords || [],
			type: 'pattern',
			blocks: parse( pattern.content ),
		} ) );

	patterns = searchItems( patterns, search, {
		categoryId,
		hasCategory: ( item, currentCategory ) =>
			item.categories?.includes( currentCategory ),
	} );

	patterns = patterns.slice( ( page - 1 ) * 20, page * 20 );

	return {
		patterns,
		isResolving: false,
		getTotalPages: async () => Math.ceil( patterns.length / 20 ),
	};
};

const reusableBlockToPattern = ( reusableBlock ) => ( {
	blocks: parse( reusableBlock.content.raw ),
	categories: reusableBlock.wp_pattern,
	id: reusableBlock.id,
	name: reusableBlock.slug,
	syncStatus: reusableBlock.wp_pattern_sync_status || SYNC_TYPES.full,
	title: reusableBlock.title.raw,
	type: reusableBlock.type,
	reusableBlock,
} );

const selectUserPatterns = (
	select,
	{ search = '', syncStatus, page = 1 } = {}
) => {
	const { getEntityRecords, getIsResolving, getEntityConfig } =
		select( coreStore );

	const query = {
		per_page: 20,
		page,
		search,
		search_columns: 'post_title',
		sync_status: syncStatus,
	};
	const records = getEntityRecords( 'postType', USER_PATTERNS, query );

	const isResolving = getIsResolving( 'getEntityRecords', [
		'postType',
		USER_PATTERNS,
		query,
	] );

	const patterns = records
		? records.map( ( record ) => reusableBlockToPattern( record ) )
		: EMPTY_PATTERN_LIST;

	const getTotalPages = async ( { signal } = {} ) => {
		const entityConfig = getEntityConfig( 'postType', USER_PATTERNS );
		const response = await apiFetch( {
			path: addQueryArgs( entityConfig.baseURL, {
				...entityConfig.baseURLParams,
				...query,
			} ),
			method: 'HEAD',
			parse: false,
			signal,
		} );
		return parseInt( response.headers.get( 'X-Wp-Totalpages' ), 10 );
	};

	return { patterns, isResolving, getTotalPages };
};

export const usePatterns = (
	categoryType,
	categoryId,
	{ search = '', page = 1, syncStatus }
) => {
	return useSelect(
		( select ) => {
			if ( categoryType === TEMPLATE_PARTS ) {
				return selectTemplatePartsAsPatterns( select, {
					categoryId,
					search,
					page,
				} );
			} else if ( categoryType === PATTERNS ) {
				return selectThemePatterns( select, {
					categoryId,
					search,
					page,
				} );
			} else if ( categoryType === USER_PATTERNS ) {
				return selectUserPatterns( select, {
					search,
					syncStatus,
					page,
				} );
			}
			return {
				patterns: EMPTY_PATTERN_LIST,
				isResolving: false,
				getTotalPages: async () => 1,
			};
		},
		[ categoryType, categoryId, search, page, syncStatus ]
	);
};

export default usePatterns;
