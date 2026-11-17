import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Returns a callback that fully unlocks blocks and every block inside them,
 * then shows a snackbar with an Undo action.
 *
 * @return Unlock callback, taking the client IDs of the blocks to unlock.
 */
export default function useUnlockBlocks() {
	const registry = useRegistry();
	const { setBlocksLock, updateBlockAttributes } = unlock(
		useDispatch( blockEditorStore )
	);
	const { createSuccessNotice } = useDispatch( noticesStore );

	return useCallback(
		( clientIds: string[] ) => {
			const { getBlockAttributes, getClientIdsOfDescendants } = unlock(
				registry.select( blockEditorStore )
			);

			// Keep the lock attributes of every affected block, to undo.
			const affectedIds = [
				...clientIds,
				...getClientIdsOfDescendants( clientIds ),
			];
			const previousAttributes: Record<
				string,
				Record< string, unknown >
			> = {};
			for ( const clientId of affectedIds ) {
				const { lock, templateLock } =
					getBlockAttributes( clientId ) ?? {};
				previousAttributes[ clientId ] = { lock, templateLock };
			}

			setBlocksLock( clientIds, {
				move: false,
				remove: false,
				layout: false,
				edit: false,
			} );

			let message: string = sprintf(
				// translators: %d: Number of blocks unlocked.
				_n(
					'%d block unlocked.',
					'%d blocks unlocked.',
					clientIds.length
				),
				clientIds.length
			);
			if ( clientIds.length === 1 ) {
				message = __( 'Block unlocked.' );
			}

			createSuccessNotice( message, {
				type: 'snackbar',
				id: 'block-editor-block-lock-notice',
				actions: [
					{
						label: __( 'Undo' ),
						onClick: () =>
							updateBlockAttributes(
								Object.keys( previousAttributes ),
								previousAttributes,
								{ uniqueByBlock: true }
							),
					},
				],
			} );
		},
		[ registry, setBlocksLock, updateBlockAttributes, createSuccessNotice ]
	);
}
