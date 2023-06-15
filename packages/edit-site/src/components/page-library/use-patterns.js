/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { searchItems } from './search-items';
import { store as editSiteStore } from '../../store';

const EMPTY_PATTERN_LIST = [];
export const TEMPLATE_PARTS = 'wp_template_part';
export const PATTERNS = 'pattern';
export const USER_PATTERNS = 'wp_block';
const SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};

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
			hasCategory: ( item, area ) => item.templatePart.area === area,
		} );
	}, [ templateParts, filterValue, categoryId ] );

	return { templateParts: filteredTemplateParts, isResolving };
};

const useBlockPatternsByCategory = (
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
				.filter( ( pattern ) => pattern.source !== 'core' )
				.filter(
					( x, index, arr ) =>
						index === arr.findIndex( ( y ) => x.name === y.name )
				)
				.map( ( pattern ) => ( {
					...pattern,
					keywords: pattern.keywords || [],
					type: 'pattern',
					blocks: parse( pattern.content ),
				} ) ),
		[ blockPatterns, restBlockPatterns ]
	);

	// Non-user-created patterns (e.g. theme patterns ) will have string
	// category names in their assigned categories array. We'll need to
	// to retrieve the current category's name to match them.
	const { record: category } = useEntityRecord(
		'taxonomy',
		'wp_pattern',
		categoryId
	);

	const filteredPatterns = useMemo( () => {
		if ( postType !== PATTERNS || ! category ) {
			return EMPTY_PATTERN_LIST;
		}

		return searchItems( patterns, filterValue, {
			// Rely on closure to check the category slug, rather than id, is in item categories.
			hasCategory: ( item ) => item.categories?.includes( category.slug ),
		} );
	}, [ patterns, filterValue, category, postType ] );

	return filteredPatterns;
};

const reusableBlockToPattern = ( reusableBlock ) => ( {
	blocks: parse( reusableBlock.content.raw ),
	categories: reusableBlock.wp_pattern,
	id: reusableBlock.id,
	name: reusableBlock.slug,
	syncStatus: reusableBlock.meta?.wp_block?.sync_status,
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
			if ( postType !== USER_PATTERNS ) {
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
		[ postType ]
	);

	const filteredPatterns = useMemo( () => {
		return searchItems( unfilteredPatterns, filterValue, {
			categoryId,
			hasCategory: ( item, currentCategory ) => {
				return currentCategory === 'uncategorized'
					? ! item.categories?.length
					: item.categories?.includes( parseInt( currentCategory ) );
			},
		} );
	}, [ unfilteredPatterns, categoryId, filterValue ] );

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
	const blockPatterns = useBlockPatternsByCategory(
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
