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
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

const EMPTY_PATTERN_LIST = [];
const TEMPLATE_PARTS = 'wp_template_part';
const PATTERNS = 'pattern';
const USER_PATTERNS = 'wp_block';

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

const useBlockPatternsByCategory = ( category, postType = PATTERNS ) => {
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

	if ( postType !== PATTERNS ) {
		return EMPTY_PATTERN_LIST;
	}

	if ( ! category ) {
		return patterns || EMPTY_PATTERN_LIST;
	}

	return patterns.filter( ( pattern ) =>
		pattern.categories?.includes( category )
	);
};

const reusableBlockToPattern = ( reusableBlock ) => ( {
	blocks: parse( reusableBlock.content.raw ),
	categories: reusableBlock.meta?.wp_block?.categories,
	name: reusableBlock.slug,
	title: reusableBlock.title.raw,
	type: reusableBlock.type,
	reusableBlock,
} );

const useUserPatterns = ( category, categoryType = PATTERNS ) => {
	const postType = categoryType === PATTERNS ? USER_PATTERNS : categoryType;
	const userPatterns = useSelect(
		( select ) => {
			if ( postType !== USER_PATTERNS ) {
				return EMPTY_PATTERN_LIST;
			}

			const { getEntityRecords } = select( coreStore );
			const nonSyncedPatterns = getEntityRecords( 'postType', postType, {
				per_page: -1,
			} );

			if ( ! nonSyncedPatterns ) {
				return EMPTY_PATTERN_LIST;
			}

			return nonSyncedPatterns.map( ( item ) =>
				reusableBlockToPattern( item )
			);
		},
		[ postType ]
	);

	return userPatterns.filter( ( pattern ) =>
		pattern.categories?.includes( category )
	);
};

export default function usePatterns( categoryType, categoryName ) {
	const patterns = useBlockPatternsByCategory( categoryName, categoryType );
	const userPatterns = useUserPatterns( categoryName, categoryType );
	const { templateParts, isResolving } = useTemplatePartsAsPatterns(
		categoryName,
		categoryType
	);

	// TODO: Add sorting etc.

	const results = [ ...templateParts, ...patterns, ...userPatterns ];
	return [ results, isResolving ];
}
