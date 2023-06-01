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

const TEMPLATE_PARTS = 'wp_template_part';
const PATTERNS = 'pattern';

const createTemplatePartId = ( theme, slug ) =>
	theme && slug ? theme + '//' + slug : null;

const toPattern = ( templatePart ) => ( {
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
				return { templateParts: [], isResolving: false };
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
			return [];
		}

		const partsAsPatterns = [];

		templateParts?.forEach( ( templatePart ) => {
			if ( ! area || templatePart.area === area ) {
				partsAsPatterns.push( toPattern( templatePart ) );
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
		return [];
	}

	if ( ! category ) {
		return patterns || [];
	}

	return patterns.filter( ( pattern ) =>
		pattern.categories?.includes( category )
	);
};

export default function usePatterns( categoryType, categoryName ) {
	const patterns = useBlockPatternsByCategory( categoryName, categoryType );
	const { templateParts, isResolving } = useTemplatePartsAsPatterns(
		categoryName,
		categoryType
	);

	// TODO: Add sorting etc.

	const results = [ ...templateParts, ...patterns ];
	return [ results, isResolving ];
}
