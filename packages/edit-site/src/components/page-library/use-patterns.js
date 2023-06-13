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
	name: createTemplatePartId( templatePart.theme, templatePart.slug ),
	title: templatePart.title.rendered,
	blocks: parse( templatePart.content.raw ),
	type: templatePart.type,
	templatePart,
} );

const useTemplatePartsAsPatterns = ( area, postType = TEMPLATE_PARTS ) => {
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

			return {
				templateParts: getEntityRecords( 'postType', postType, query ),
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

		const partsAsPatterns = [];

		templateParts?.forEach( ( templatePart ) => {
			if ( ! area || templatePart.area === area ) {
				partsAsPatterns.push( templatePartToPattern( templatePart ) );
			}
		} );

		return partsAsPatterns;
	}, [ templateParts, area ] );

	return { templateParts: filteredTemplateParts, isResolving };
};

const useBlockPatternsByCategory = ( categoryId, postType = PATTERNS ) => {
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

	if ( postType !== PATTERNS || ! category ) {
		return EMPTY_PATTERN_LIST;
	}

	return patterns.filter( ( pattern ) =>
		pattern.categories?.includes( category.slug )
	);
};

const reusableBlockToPattern = ( reusableBlock ) => ( {
	blocks: parse( reusableBlock.content.raw ),
	categories: reusableBlock.wp_pattern,
	id: reusableBlock.id,
	name: reusableBlock.slug,
	title: reusableBlock.title.raw,
	type: reusableBlock.type,
	reusableBlock,
} );

const useUserPatterns = ( categoryId, categoryType = PATTERNS ) => {
	const postType = categoryType === PATTERNS ? USER_PATTERNS : categoryType;
	const unfilteredPatterns = useSelect(
		( select ) => {
			if ( postType !== USER_PATTERNS ) {
				return {};
			}

			const { getEntityRecords } = select( coreStore );
			const records = getEntityRecords( 'postType', postType, {
				per_page: -1,
			} );

			if ( ! records ) {
				return {};
			}

			const patterns = { synced: [], unsynced: [] };

			records.forEach( ( record ) => {
				const pattern = reusableBlockToPattern( record );

				if ( record.meta?.wp_block?.sync_status === SYNC_TYPES.full ) {
					patterns.synced.push( pattern );
				} else {
					patterns.unsynced.push( pattern );
				}
			} );

			return patterns;
		},
		[ postType ]
	);

	if ( categoryId === 'uncategorized' ) {
		return {
			syncedPatterns: unfilteredPatterns.synced?.filter(
				( pattern ) => ! pattern.categories?.length
			),
			unsyncedPatterns: unfilteredPatterns.unsynced?.filter(
				( pattern ) => ! pattern.categories?.length
			),
		};
	}

	const currentId = parseInt( categoryId );

	return {
		syncedPatterns: unfilteredPatterns.synced?.filter( ( pattern ) =>
			pattern.categories?.includes( currentId )
		),
		unsyncedPatterns: unfilteredPatterns.unsynced?.filter( ( pattern ) =>
			pattern.categories?.includes( currentId )
		),
	};
};

export const usePatterns = ( categoryType, categoryId ) => {
	const blockPatterns = useBlockPatternsByCategory(
		categoryId,
		categoryType
	);
	const { syncedPatterns = [], unsyncedPatterns = [] } = useUserPatterns(
		categoryId,
		categoryType
	);
	const { templateParts, isResolving } = useTemplatePartsAsPatterns(
		categoryId,
		categoryType
	);

	const patterns = {
		syncedPatterns: [ ...templateParts, ...syncedPatterns ],
		unsyncedPatterns: [ ...blockPatterns, ...unsyncedPatterns ],
	};

	return [ patterns, isResolving ];
};

export default usePatterns;
