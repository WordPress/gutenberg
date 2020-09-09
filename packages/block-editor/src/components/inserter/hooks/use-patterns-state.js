/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Retrieves the block patterns inserter state.
 *
 * @param {Function} onInsert function called when inserter a list of blocks.
 *
 * @return {Array} Returns the patterns state. (patterns, categories, onSelect handler)
 */
const usePatternsState = ( onInsert, selectedCategory ) => {
	const { patternCategory, patterns, allPatternCategories } = useSelect(
		( select ) => {
			const {
				__experimentalBlockPatterns,
				__experimentalBlockPatternCategories,
			} = select( 'core/block-editor' ).getSettings();

			const category = selectedCategory
				? selectedCategory
				: __experimentalBlockPatternCategories[ 0 ];

			const patternCategoryPatterns =
				category === 'all'
					? __experimentalBlockPatterns
					: __experimentalBlockPatterns.filter(
							( pattern ) =>
								pattern.categories &&
								pattern.categories.includes( category.name )
					  );

			return {
				patternCategory: category,
				patterns: patternCategoryPatterns,
				allPatternCategories: __experimentalBlockPatternCategories,
			};
		},
		[ selectedCategory ]
	);
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const onClickPattern = useCallback( ( pattern, blocks ) => {
		onInsert(
			map( blocks, ( block ) => cloneBlock( block ) ),
			pattern.name
		);
		createSuccessNotice(
			sprintf(
				/* translators: %s: block pattern title. */
				__( 'Block pattern "%s" inserted.' ),
				pattern.title
			),
			{
				type: 'snackbar',
			}
		);
	}, [] );

	return [ patternCategory, patterns, allPatternCategories, onClickPattern ];
};

export default usePatternsState;
