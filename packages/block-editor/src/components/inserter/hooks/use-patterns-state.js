/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { cloneBlock, createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { INSERTER_PATTERN_TYPES } from '../block-patterns-tab/utils';

/**
 * Retrieves the block patterns inserter state.
 *
 * @param {Function} onInsert         function called when inserter a list of blocks.
 * @param {string=}  rootClientId     Insertion's root client ID.
 *
 * @param {string}   selectedCategory The selected pattern category.
 * @return {Array} Returns the patterns state. (patterns, categories, onSelect handler)
 */
const usePatternsState = ( onInsert, rootClientId, selectedCategory ) => {
	const { patternCategories, patterns, userPatternCategories } = useSelect(
		( select ) => {
			const { __experimentalGetAllowedPatterns, getSettings } =
				select( blockEditorStore );
			const {
				__experimentalUserPatternCategories,
				__experimentalBlockPatternCategories,
			} = getSettings();
			return {
				patterns: __experimentalGetAllowedPatterns( rootClientId ),
				userPatternCategories: __experimentalUserPatternCategories,
				patternCategories: __experimentalBlockPatternCategories,
			};
		},
		[ rootClientId ]
	);

	const allCategories = useMemo( () => {
		const categories = [ ...patternCategories ];
		userPatternCategories?.forEach( ( userCategory ) => {
			if (
				! categories.find(
					( existingCategory ) =>
						existingCategory.name === userCategory.name
				)
			) {
				categories.push( userCategory );
			}
		} );
		return categories;
	}, [ patternCategories, userPatternCategories ] );

	const { createSuccessNotice } = useDispatch( noticesStore );
	const onClickPattern = useCallback(
		( pattern, blocks ) => {
			const patternBlocks =
				pattern.type === INSERTER_PATTERN_TYPES.user &&
				pattern.syncStatus !== 'unsynced'
					? [ createBlock( 'core/block', { ref: pattern.id } ) ]
					: blocks;
			onInsert(
				( patternBlocks ?? [] ).map( ( block ) => {
					const clonedBlock = cloneBlock( block );
					if (
						clonedBlock.attributes.metadata?.categories?.includes(
							selectedCategory
						)
					) {
						clonedBlock.attributes.metadata.categories = [
							selectedCategory,
						];
					}
					return clonedBlock;
				} ),
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
					id: 'block-pattern-inserted-notice',
				}
			);
		},
		[ createSuccessNotice, onInsert, selectedCategory ]
	);

	return [ patterns, allCategories, onClickPattern ];
};

export default usePatternsState;
