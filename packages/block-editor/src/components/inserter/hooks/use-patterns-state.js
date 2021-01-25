/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { cloneBlock, parse } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import containsOnlyAllowedBlocks from '../utils/contains-only-allowed-blocks';

/**
 * Retrieves the block patterns inserter state.
 *
 * @param {string=}  rootClientId Insertion's root client ID.
 * @param {Function} onInsert     function called when inserter a list of blocks.
 *
 * @return {Array} Returns the patterns state. (patterns, categories, onSelect handler)
 */
const usePatternsState = ( rootClientId, onInsert ) => {
	const { patternCategories, patterns, allowedBlocks } = useSelect(
		( select ) => {
			const { __experimentalGetAllowedBlocks, getSettings } = select(
				'core/block-editor'
			);
			const {
				__experimentalBlockPatterns,
				__experimentalBlockPatternCategories,
			} = getSettings();

			return {
				allowedBlocks: __experimentalGetAllowedBlocks( rootClientId ),
				patterns: __experimentalBlockPatterns,
				patternCategories: __experimentalBlockPatternCategories,
			};
		},
		[ rootClientId ]
	);

	const allowedPatterns = useMemo( () => {
		if (
			! rootClientId ||
			! Array.isArray( allowedBlocks ) ||
			! Array.isArray( patterns )
		) {
			return patterns;
		}

		return patterns.filter( ( pattern ) => {
			const blocks = parse( pattern.content );
			return containsOnlyAllowedBlocks( blocks, allowedBlocks );
		} );
	}, [ rootClientId, allowedBlocks, patterns ] );

	const { createSuccessNotice } = useDispatch( noticesStore );
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

	return [ allowedPatterns, patternCategories, onClickPattern ];
};

export default usePatternsState;
