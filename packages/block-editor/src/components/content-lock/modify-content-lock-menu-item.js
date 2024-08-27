/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

// The implementation of content locking is mainly in this file, although the mechanism
// to stop temporarily editing as blocks when an outside block is selected is on component StopEditingAsBlocksOnOutsideSelect
// at block-editor/src/components/block-list/index.js.
// Besides the components on this file and the file referenced above the implementation
// also includes artifacts on the store (actions, reducers, and selector).

export function ModifyContentLockMenuItem( { clientId, onClose } ) {
	const { templateLock, isLockedByParent, isEditingAsBlocks } = useSelect(
		( select ) => {
			const {
				getContentLockingParent,
				getTemplateLock,
				getTemporarilyEditingAsBlocks,
			} = unlock( select( blockEditorStore ) );
			return {
				templateLock: getTemplateLock( clientId ),
				isLockedByParent: !! getContentLockingParent( clientId ),
				isEditingAsBlocks: getTemporarilyEditingAsBlocks() === clientId,
			};
		},
		[ clientId ]
	);
	const blockEditorActions = useDispatch( blockEditorStore );
	const isContentLocked =
		! isLockedByParent && templateLock === 'contentOnly';
	if ( ! isContentLocked && ! isEditingAsBlocks ) {
		return null;
	}

	const { modifyContentLockBlock } = unlock( blockEditorActions );
	const showStartEditingAsBlocks = ! isEditingAsBlocks && isContentLocked;

	return (
		showStartEditingAsBlocks && (
			<MenuItem
				onClick={ () => {
					modifyContentLockBlock( clientId );
					onClose();
				} }
			>
				{ _x( 'Modify', 'Unlock content locked blocks' ) }
			</MenuItem>
		)
	);
}
