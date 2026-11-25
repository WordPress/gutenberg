import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useDispatch, useRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Returns a callback that fully locks or unlocks blocks and every block inside
 * them, then shows a snackbar with an Undo action.
 *
 * @param isLocked Whether the callback locks the blocks or unlocks them.
 *
 * @return Callback, taking the client IDs of the blocks to change.
 */
function useFullLock( isLocked: boolean ) {
	const registry = useRegistry();
	const { setBlocksLock, updateBlockAttributes } = unlock(
		useDispatch( blockEditorStore )
	);
	const { createSuccessNotice } = useDispatch( noticesStore );

	return useCallback(
		( clientIds: string[] ) => {
			const {
				getBlockAttributes,
				getBlockParents,
				getClientIdsOfDescendants,
			} = unlock( registry.select( blockEditorStore ) );

			// Keep the lock attributes of every affected block, to undo: the
			// blocks, every block inside them, and the blocks above them, whose
			// locks an unlock can also change.
			const affectedIds = [
				...new Set( [
					...clientIds.flatMap( ( clientId ) =>
						getBlockParents( clientId )
					),
					...clientIds,
					...getClientIdsOfDescendants( clientIds ),
				] ),
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
				move: isLocked,
				remove: isLocked,
				layout: isLocked,
				styles: isLocked,
			} );

			let message: string;
			if ( clientIds.length === 1 ) {
				message = isLocked
					? __( 'Block locked.' )
					: __( 'Block unlocked.' );
			} else {
				message = isLocked
					? sprintf(
							// translators: %d: Number of blocks locked.
							_n(
								'%d block locked.',
								'%d blocks locked.',
								clientIds.length
							),
							clientIds.length
						)
					: sprintf(
							// translators: %d: Number of blocks unlocked.
							_n(
								'%d block unlocked.',
								'%d blocks unlocked.',
								clientIds.length
							),
							clientIds.length
						);
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
		[
			isLocked,
			registry,
			setBlocksLock,
			updateBlockAttributes,
			createSuccessNotice,
		]
	);
}

/**
 * Returns a callback that locks every property of blocks and of every block
 * inside them, then shows a snackbar with an Undo action.
 *
 * @return Lock callback, taking the client IDs of the blocks to lock.
 */
export function useLockBlocks() {
	return useFullLock( true );
}

/**
 * Returns a callback that fully unlocks blocks and every block inside them,
 * then shows a snackbar with an Undo action.
 *
 * @return Unlock callback, taking the client IDs of the blocks to unlock.
 */
export function useUnlockBlocks() {
	return useFullLock( false );
}
