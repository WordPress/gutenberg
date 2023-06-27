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
import { store as blockEditorStore } from '../../../store';

/**
 * Retrieves the block patterns inserter state.
 *
 * @param {Function} onInsert     function called when inserter a list of blocks.
 * @param {string=}  rootClientId Insertion's root client ID.
 *
 * @return {Array} Returns the patterns state. (patterns, categories, onSelect handler)
 */
const usePatternsState = ( onInsert, rootClientId ) => {
	const { patternCategories, patterns, unsyncedPatterns } = useSelect(
		( select ) => {
			const {
				__experimentalGetAllowedPatterns,
				getSettings,
				getInserterItems,
			} = select( blockEditorStore );
			return {
				patterns: __experimentalGetAllowedPatterns( rootClientId ),
				patternCategories:
					getSettings().__experimentalBlockPatternCategories,
				unsyncedPatterns: getInserterItems( rootClientId, 'unsynced' ),
			};
		},
		[ rootClientId ]
	);

	const allPatterns = useMemo( () => {
		const parsedUnsyncedPatterns = unsyncedPatterns.map(
			( syncedPattern ) => ( {
				title: syncedPattern.title,
				name: syncedPattern.id,
				categories: [ 'custom' ],
				blocks: parse( syncedPattern.content, {
					__unstableSkipMigrationLogs: true,
				} ),
			} )
		);
		return [ ...patterns, ...parsedUnsyncedPatterns ];
	}, [ unsyncedPatterns, patterns ] );

	const allCategories = useMemo( () => {
		const customPatternsCategory = {
			name: 'custom',
			label: __( 'Custom patterns' ),
			description: __( 'Custom patterns add by site users' ),
		};
		return [ ...patternCategories, customPatternsCategory ];
	}, [ patternCategories ] );

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
				}
			);
		},
		[ createSuccessNotice, onInsert ]
	);

	return [ allPatterns, allCategories, onClickPattern ];
};

export default usePatternsState;
