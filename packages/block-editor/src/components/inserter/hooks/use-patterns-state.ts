import type { Block } from '@wordpress/blocks';
import { useCallback, useMemo } from '@wordpress/element';
import { cloneBlock, createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import {
	isNavigationOverlayContextKey,
	userPatternCategoriesSelectKey,
} from '../../../store/private-keys';
import { INSERTER_PATTERN_TYPES } from '../block-patterns-tab/utils';
import { isFiltered } from '../../../store/utils';
import type { BlockPattern } from '../../../store/types';
import type { InsertBlocks, PatternCategory, PatternsState } from '../types';

// Shared so the selector cache survives the inserter closing and reopening.
const FILTERED_OPTIONS = { [ isFiltered ]: true };
const UNFILTERED_OPTIONS = { [ isFiltered ]: false };

/**
 * Retrieves the block patterns inserter state.
 *
 * @param onInsert         function called when inserter a list of blocks.
 * @param rootClientId     Insertion's root client ID.
 * @param selectedCategory The selected pattern category.
 * @param isQuick          For the quick inserter render only allowed patterns.
 *
 * @return Returns the patterns state. (patterns, categories, onSelect handler)
 */
const usePatternsState = (
	onInsert: InsertBlocks | undefined,
	rootClientId: string | null | undefined,
	selectedCategory?: string,
	isQuick?: boolean
): PatternsState => {
	const options = isQuick ? FILTERED_OPTIONS : UNFILTERED_OPTIONS;

	// Check if we're editing a navigation-overlay template part.
	// This information is passed through block editor settings to avoid
	// cross-package dependencies.
	const isWithinNavigationOverlayContext = useSelect( ( select ) => {
		const { getSettings } = unlock( select( blockEditorStore ) );
		const settings = getSettings();
		return settings[ isNavigationOverlayContextKey ] ?? false;
	}, [] );

	const { patternCategories, patterns, userPatternCategories } = useSelect(
		( select ) => {
			const { getSettings, __experimentalGetAllowedPatterns } = unlock(
				select( blockEditorStore )
			);
			const settings = getSettings();
			const userPatternCategoriesSelect =
				settings[ userPatternCategoriesSelectKey ];
			return {
				patterns: __experimentalGetAllowedPatterns(
					rootClientId,
					options
				),
				userPatternCategories: userPatternCategoriesSelect
					? userPatternCategoriesSelect( select )
					: settings.__experimentalUserPatternCategories,
				patternCategories:
					settings.__experimentalBlockPatternCategories,
			};
		},
		[ rootClientId, options ]
	);

	// Filter out patterns with "navigation" category unless we're in
	// navigation-overlay template part context.
	// TO DO: create an api for patterns to decide in which context they should be shown.
	const filteredPatterns = useMemo( () => {
		return patterns.filter( ( pattern: BlockPattern ) => {
			const hasNavigationCategory =
				pattern.categories?.includes( 'navigation' );
			if ( hasNavigationCategory && ! isWithinNavigationOverlayContext ) {
				return false;
			}
			return true;
		} );
	}, [ patterns, isWithinNavigationOverlayContext ] );
	const { getClosestAllowedInsertionPointForPattern } = unlock(
		useSelect( blockEditorStore )
	);

	const allCategories = useMemo( () => {
		const categories: PatternCategory[] = [ ...patternCategories ];
		userPatternCategories?.forEach( ( userCategory: PatternCategory ) => {
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
		( pattern: BlockPattern, blocks?: Block[] ) => {
			const destinationRootClientId = isQuick
				? rootClientId
				: getClosestAllowedInsertionPointForPattern(
						pattern,
						rootClientId
					);
			if ( destinationRootClientId === null ) {
				return;
			}
			const patternBlocks =
				pattern.type === INSERTER_PATTERN_TYPES.user &&
				pattern.syncStatus !== 'unsynced'
					? [ createBlock( 'core/block', { ref: pattern.id } ) ]
					: blocks;
			// The callers that select patterns pass `onInsert`.
			onInsert!(
				( patternBlocks ?? [] ).map( ( block ) => {
					const clonedBlock = cloneBlock( block );
					// The metadata attribute holds the pattern categories.
					const metadata = clonedBlock.attributes.metadata as
						{ categories?: string[] } | undefined;
					if (
						metadata?.categories?.includes(
							// A missing category matches none of the categories.
							selectedCategory as string
						)
					) {
						// Matched above, so the category is set.
						metadata.categories = [ selectedCategory as string ];
					}
					return clonedBlock;
				} ),
				// @ts-expect-error Bug: the pattern name is passed as the meta object, which the store ignores.
				pattern.name,
				false,
				destinationRootClientId
			);
			createSuccessNotice(
				sprintf(
					/* translators: %s: block pattern title. */
					__( 'Pattern "%s" inserted.' ),
					// Registered patterns have a title.
					pattern.title as string
				),
				{
					type: 'snackbar',
					id: 'inserter-notice',
				}
			);
		},
		[
			createSuccessNotice,
			onInsert,
			selectedCategory,
			rootClientId,
			getClosestAllowedInsertionPointForPattern,
			isQuick,
		]
	);

	return [ filteredPatterns, allCategories, onClickPattern ];
};

export default usePatternsState;
