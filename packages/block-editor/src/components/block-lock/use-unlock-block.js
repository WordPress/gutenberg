/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useBlockLock from './use-block-lock';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Returns a callback that fully unlocks the given block and shows a snackbar
 * with an Undo action.
 *
 * @param {string} clientId Block client ID.
 * @return {Function} Unlock callback.
 */
export default function useUnlockBlock( clientId ) {
	const { isEditLocked } = useBlockLock( clientId );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const registry = useRegistry();
	const isPatternSection = useSelect(
		( select ) => {
			const blockEditorSelect = select( blockEditorStore );
			const { getBlockAttributes } = blockEditorSelect;
			const { isSectionBlock } = unlock( blockEditorSelect );

			return (
				!! getBlockAttributes( clientId )?.metadata?.patternName &&
				isSectionBlock( clientId )
			);
		},
		[ clientId ]
	);

	return useCallback( () => {
		const previousAttributes = registry
			.select( blockEditorStore )
			.getBlockAttributes( clientId );
		const previousLock = previousAttributes?.lock;
		const previousTemplateLock = previousAttributes?.templateLock;
		const previousMetadata = previousAttributes?.metadata;

		let nextMetadata = previousMetadata;
		if ( isPatternSection && previousMetadata ) {
			nextMetadata = { ...previousMetadata };
			delete nextMetadata.patternName;
			nextMetadata = Object.keys( nextMetadata ).length
				? nextMetadata
				: undefined;
		}

		updateBlockAttributes( [ clientId ], {
			lock: {
				move: false,
				remove: false,
				...( isEditLocked && { edit: false } ),
			},
			templateLock: undefined,
			...( isPatternSection && { metadata: nextMetadata } ),
		} );

		createSuccessNotice(
			isPatternSection
				? __( 'Pattern detached.' )
				: __( 'Block unlocked.' ),
			{
				type: 'snackbar',
				id: 'block-editor-block-lock-notice',
				actions: [
					{
						label: __( 'Undo' ),
						onClick: () =>
							updateBlockAttributes( [ clientId ], {
								lock: previousLock,
								templateLock: previousTemplateLock,
								...( isPatternSection && {
									metadata: previousMetadata,
								} ),
							} ),
					},
				],
			}
		);
	}, [
		clientId,
		createSuccessNotice,
		isEditLocked,
		isPatternSection,
		registry,
		updateBlockAttributes,
	] );
}
