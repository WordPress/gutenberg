/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';

const useUserPatterns = () => {
	const userPatterns = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		const nonSyncedPatterns = getEntityRecords( 'postType', 'wp_block', {
			per_page: -1,
		} );

		return nonSyncedPatterns?.map( ( item ) => ( {
			categories: [ item.meta?.wp_block_categories ],
			name: item.slug,
		} ) );
	}, [] );

	return userPatterns;
};

export default function usePatternCategories() {
	const { blockPatterns, blockPatternCategories } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		const settings = getSettings();

		return {
			blockPatterns:
				settings.__experimentalAdditionalBlockPatterns ??
				settings.__experimentalBlockPatterns,
			blockPatternCategories:
				settings.__experimentalAdditionalBlockPatternCategories ??
				settings.__experimentalBlockPatternCategories,
		};
	} );

	const { restBlockPatterns, restBlockPatternCategories } = useSelect(
		( select ) => ( {
			restBlockPatterns: select( coreStore ).getBlockPatterns(),
			restBlockPatternCategories:
				select( coreStore ).getBlockPatternCategories(),
		} )
	);

	const userPatterns = useUserPatterns();

	const patterns = useMemo(
		() =>
			[
				...( blockPatterns || [] ),
				...( restBlockPatterns || [] ),
				...( userPatterns || [] ),
			].filter(
				( x, index, arr ) =>
					index === arr.findIndex( ( y ) => x.name === y.name )
			),
		[ blockPatterns, restBlockPatterns ]
	);

	const categories = useMemo( () => {
		const combinedCategories = [
			...( blockPatternCategories || [] ),
			...( restBlockPatternCategories || [] ),
		];

		const categoryMap = {};

		combinedCategories.forEach( ( category ) => {
			if ( ! categoryMap[ category.name ] ) {
				category.count = 0;
				categoryMap[ category.name ] = category;
			}
		} );

		patterns.forEach( ( pattern ) => {
			pattern.categories?.forEach( ( patternCategory ) => {
				if ( categoryMap[ patternCategory ] ) {
					categoryMap[ patternCategory ].count += 1;
				}
			} );
		} );

		return categoryMap;
	}, [ blockPatternCategories, restBlockPatternCategories, patterns ] );

	return {
		hasPatterns: !! patterns.length,
		patternCategories: Object.values( categories ),
	};
}
