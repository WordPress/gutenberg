/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { cloneBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

const CUSTOM_CATEGORY = {
	name: 'custom',
	label: __( 'My patterns' ),
	description: __( 'Custom patterns added by site users.' ),
};

/**
 * Retrieves the block patterns inserter state.
 *
 * @param {Function} onInsert     function called when inserter a list of blocks.
 * @param {string=}  rootClientId Insertion's root client ID.
 *
 * @return {Array} Returns the patterns state. (patterns, categories, onSelect handler)
 */
const usePatternsState = ( onInsert, rootClientId ) => {
	const { patternCategories, patterns, userPatternCategories } = useSelect(
		( select ) => {
			const {
				__experimentalGetAllowedPatterns,
				__experimentalUserPatternCategories,
				getSettings,
			} = select( blockEditorStore );
			return {
				patterns: __experimentalGetAllowedPatterns( rootClientId ),
				userPatternCategories:
					__experimentalUserPatternCategories().map( ( cat ) => ( {
						...cat,
						label: cat.name,
						name: cat.slug,
					} ) ),
				patternCategories:
					getSettings().__experimentalBlockPatternCategories,
			};
		},
		[ rootClientId ]
	);

	const allCategories = useMemo(
		() => [ ...patternCategories, CUSTOM_CATEGORY ],
		[ patternCategories ]
	);

	const { createSuccessNotice } = useDispatch( noticesStore );
	const onClickPattern = useCallback(
		( pattern, blocks ) => {
			onInsert(
				( blocks ?? [] ).map( ( block ) => cloneBlock( block ) ),
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
		[ createSuccessNotice, onInsert ]
	);

	return { patterns, allCategories, userPatternCategories, onClickPattern };
};

export default usePatternsState;
