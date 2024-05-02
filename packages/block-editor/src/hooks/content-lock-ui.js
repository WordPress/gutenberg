/**
 * WordPress dependencies
 */
import { ToolbarButton, MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { BlockControls, BlockSettingsMenuControls } from '../components';
import { unlock } from '../lock-unlock';

// The implementation of content locking is mainly in this file, although the mechanism
// to stop temporarily editing as blocks when an outside block is selected is on component StopEditingAsBlocksOnOutsideSelect
// at block-editor/src/components/block-list/index.js.
// Besides the components on this file and the file referenced above the implementation
// also includes artifacts on the store (actions, reducers, and selector).

function ContentLockControlsPure( { clientId, isSelected } ) {
	const { getBlockListSettings, getSettings } = useSelect( blockEditorStore );
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

	const {
		updateSettings,
		updateBlockListSettings,
		__unstableSetTemporarilyEditingAsBlocks,
	} = useDispatch( blockEditorStore );
	const { stopEditingAsBlocks } = unlock( useDispatch( blockEditorStore ) );
	const isContentLocked =
		! isLockedByParent && templateLock === 'contentOnly';
	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const stopEditingAsBlockCallback = useCallback( () => {
		stopEditingAsBlocks( clientId );
	}, [ clientId, stopEditingAsBlocks ] );

	if ( ! isContentLocked && ! isEditingAsBlocks ) {
		return null;
	}

	const showStopEditingAsBlocks = isEditingAsBlocks && ! isContentLocked;
	const showStartEditingAsBlocks =
		! isEditingAsBlocks && isContentLocked && isSelected;

	return (
		<>
			{ showStopEditingAsBlocks && (
				<>
					<BlockControls group="other">
						<ToolbarButton onClick={ stopEditingAsBlockCallback }>
							{ __( 'Done' ) }
						</ToolbarButton>
					</BlockControls>
				</>
			) }
			{ showStartEditingAsBlocks && (
				<BlockSettingsMenuControls>
					{ ( { onClose } ) => (
						<MenuItem
							onClick={ () => {
								__unstableMarkNextChangeAsNotPersistent();
								updateBlockAttributes( clientId, {
									templateLock: undefined,
								} );
								updateBlockListSettings( clientId, {
									...getBlockListSettings( clientId ),
									templateLock: false,
								} );
								const focusModeToRevert =
									getSettings().focusMode;
								updateSettings( { focusMode: true } );
								__unstableSetTemporarilyEditingAsBlocks(
									clientId,
									focusModeToRevert
								);
								onClose();
							} }
						>
							{ __( 'Modify' ) }
						</MenuItem>
					) }
				</BlockSettingsMenuControls>
			) }
		</>
	);
}

export default {
	edit: ContentLockControlsPure,
	hasSupport() {
		return true;
	},
};
