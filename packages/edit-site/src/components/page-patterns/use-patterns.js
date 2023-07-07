/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	CORE_PATTERN_SOURCES,
	PATTERNS,
	SYNC_TYPES,
	TEMPLATE_PARTS,
	USER_PATTERNS,
	USER_PATTERN_CATEGORY,
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
	keywords: templatePart.keywords || [],
	name: createTemplatePartId( templatePart.theme, templatePart.slug ),
	title: templatePart.title.rendered,
	type: templatePart.type,
	templatePart,
} );

const templatePartHasCategory = ( item, category ) =>
	item.templatePart.area === category;

const useTemplatePartsAsPatterns = (
	categoryId,
	postType = TEMPLATE_PARTS,
	filterValue = ''
) => {
	const { templateParts, isResolving } = useSelect(
		( select ) => {
			if ( postType !== TEMPLATE_PARTS ) {
				return {
					templateParts: EMPTY_PATTERN_LIST,
					isResolving: false,
				};
			}

			const { getEntityRecords, isResolving: _isResolving } =
				select( coreStore );
			const query = { per_page: -1 };
			const rawTemplateParts = getEntityRecords(
				'postType',
				postType,
				query
			);
			const partsAsPatterns = rawTemplateParts?.map( ( templatePart ) =>
				templatePartToPattern( templatePart )
			);

			return {
				templateParts: partsAsPatterns,
				isResolving: _isResolving( 'getEntityRecords', [
					'postType',
					'wp_template_part',
					query,
				] ),
			};
		},
		[ postType ]
	);

	const filteredTemplateParts = useMemo( () => {
		if ( ! templateParts ) {
			return EMPTY_PATTERN_LIST;
		}

		return searchItems( templateParts, filterValue, {
			categoryId,
			hasCategory: templatePartHasCategory,
		} );
	}, [ templateParts, filterValue, categoryId ] );

	return { templateParts: filteredTemplateParts, isResolving };
};

const useThemePatterns = (
	categoryId,
	postType = PATTERNS,
	filterValue = ''
) => {
	const blockPatterns = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		const settings = getSettings();
		return (
			settings.__experimentalAdditionalBlockPatterns ??
			settings.__experimentalBlockPatterns
		);
	} );

	const restBlockPatterns = useSelect( ( select ) =>
		select( coreStore ).getBlockPatterns()
	);

	const patterns = useMemo(
		() =>
			[ ...( blockPatterns || [] ), ...( restBlockPatterns || [] ) ]
				.filter(
					( pattern ) =>
						! CORE_PATTERN_SOURCES.includes( pattern.source )
				)
				.filter( filterOutDuplicatesByName )
				.map( ( pattern ) => ( {
					...pattern,
					keywords: pattern.keywords || [],
					type: 'pattern',
					blocks: parse( pattern.content ),
				} ) ),
		[ blockPatterns, restBlockPatterns ]
	);

	const filteredPatterns = useMemo( () => {
		if ( postType !== PATTERNS ) {
			return EMPTY_PATTERN_LIST;
		}

		return searchItems( patterns, filterValue, {
			categoryId,
			hasCategory: ( item, currentCategory ) =>
				item.categories?.includes( currentCategory ),
		} );
	}, [ patterns, filterValue, categoryId, postType ] );

	return filteredPatterns;
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

const useUserPatterns = (
	categoryId,
	categoryType = PATTERNS,
	filterValue = ''
) => {
	const postType = categoryType === PATTERNS ? USER_PATTERNS : categoryType;
	const unfilteredPatterns = useSelect(
		( select ) => {
			if (
				postType !== USER_PATTERNS ||
				categoryId !== USER_PATTERN_CATEGORY
			) {
				return EMPTY_PATTERN_LIST;
			}

			const { getEntityRecords } = select( coreStore );
			const records = getEntityRecords( 'postType', postType, {
				per_page: -1,
			} );

			if ( ! records ) {
				return EMPTY_PATTERN_LIST;
			}

			return records.map( ( record ) =>
				reusableBlockToPattern( record )
			);
		},
		[ postType, categoryId ]
	);

	const filteredPatterns = useMemo( () => {
		if ( ! unfilteredPatterns.length ) {
			return EMPTY_PATTERN_LIST;
		}

		return searchItems( unfilteredPatterns, filterValue, {
			// We exit user pattern retrieval early if we aren't in the
			// catch-all category for user created patterns, so it has
			// to be in the category.
			hasCategory: () => true,
		} );
	}, [ unfilteredPatterns, filterValue ] );

	const patterns = { syncedPatterns: [], unsyncedPatterns: [] };

	filteredPatterns.forEach( ( pattern ) => {
		if ( pattern.syncStatus === SYNC_TYPES.full ) {
			patterns.syncedPatterns.push( pattern );
		} else {
			patterns.unsyncedPatterns.push( pattern );
		}
	} );

	return patterns;
};

export const usePatterns = ( categoryType, categoryId, filterValue ) => {
	const blockPatterns = useThemePatterns(
		categoryId,
		categoryType,
		filterValue
	);

	const { syncedPatterns = [], unsyncedPatterns = [] } = useUserPatterns(
		categoryId,
		categoryType,
		filterValue
	);

	const { templateParts, isResolving } = useTemplatePartsAsPatterns(
		categoryId,
		categoryType,
		filterValue
	);

	const patterns = {
		syncedPatterns: [ ...templateParts, ...syncedPatterns ],
		unsyncedPatterns: [ ...blockPatterns, ...unsyncedPatterns ],
	};

	return [ patterns, isResolving ];
};

export default usePatterns;
