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
const usePatternsState = ( onInsert ) => {
	const { patternCategories, patterns } = useSelect( ( select ) => {
		const {
			__experimentalBlockPatterns,
			__experimentalBlockPatternCategories,
		} = select( 'core/block-editor' ).getSettings();
		return {
			patterns: __experimentalBlockPatterns,
			patternCategories: __experimentalBlockPatternCategories,
		};
	}, [] );
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const onClickPattern = useCallback( ( pattern, blocks ) => {
		onInsert( map( blocks, ( block ) => cloneBlock( block ) ) );
		createSuccessNotice(
			sprintf(
				/* translators: %s: block pattern title. */
				__( 'Pattern "%s" inserted.' ),
				pattern.title
			),
			{
				type: 'snackbar',
			}
		);
	}, [] );

	return [ patterns, patternCategories, onClickPattern ];
};

export default usePatternsState;
