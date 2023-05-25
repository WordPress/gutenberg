/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function usePatternCategories() {
	return useSelect( ( select ) => {
		const { __experimentalGetAllowedPatterns, getSettings } =
			select( blockEditorStore );
		const patterns = __experimentalGetAllowedPatterns();
		const patternCategories = {};

		getSettings().__experimentalBlockPatternCategories.forEach(
			( category ) => {
				category.count = 0;
				patternCategories[ category.name ] = category;
			}
		);

		patterns.forEach( ( pattern ) => {
			pattern.categories.forEach( ( patternCategory ) => {
				if ( patternCategories[ patternCategory ] ) {
					patternCategories[ patternCategory ].count += 1;
				}
			} );
		} );

		return {
			hasPatterns: !! patterns.length,
			patternCategories: Object.values( patternCategories ),
		};
	}, [] );
}
