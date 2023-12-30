/**
 * WordPress dependencies
 */
import { ToolbarButton, MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { BlockControls, BlockSettingsMenuControls } from '../components';

function StopEditingAsBlocksOnOutsideSelect( {
	clientId,
	stopEditingAsBlock,
} ) {
	const isBlockOrDescendantSelected = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock } =
				select( blockEditorStore );
			return (
				isBlockSelected( clientId ) ||
				hasSelectedInnerBlock( clientId, true )
			);
		},
		[ clientId ]
	);
	useEffect( () => {
		if ( ! isBlockOrDescendantSelected ) {
			stopEditingAsBlock();
		}
	}, [ isBlockOrDescendantSelected, stopEditingAsBlock ] );
	return null;
}

function ContentLockControlsPure( { clientId, isSelected } ) {
	const { getBlockListSettings, getSettings } = useSelect( blockEditorStore );
	const focusModeToRevert = useRef();
	const { templateLock, isLockedByParent, isEditingAsBlocks } = useSelect(
		( select ) => {
			const {
				__unstableGetContentLockingParent,
				getTemplateLock,
				__unstableGetTemporarilyEditingAsBlocks,
			} = select( blockEditorStore );
			return {
				templateLock: getTemplateLock( clientId ),
				isLockedByParent:
					!! __unstableGetContentLockingParent( clientId ),
				isEditingAsBlocks:
					__unstableGetTemporarilyEditingAsBlocks() === clientId,
			};
		},
		[ clientId ]
	);

	const {
		updateSettings,
		updateBlockListSettings,
		__unstableSetTemporarilyEditingAsBlocks,
	} = useDispatch( blockEditorStore );
	const isContentLocked =
		! isLockedByParent && templateLock === 'contentOnly';
	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const stopEditingAsBlock = useCallback( () => {
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( clientId, {
			templateLock: 'contentOnly',
		} );
		updateBlockListSettings( clientId, {
			...getBlockListSettings( clientId ),
			templateLock: 'contentOnly',
		} );
		updateSettings( { focusMode: focusModeToRevert.current } );
		__unstableSetTemporarilyEditingAsBlocks();
	}, [
		clientId,
		updateSettings,
		updateBlockListSettings,
		getBlockListSettings,
		__unstableMarkNextChangeAsNotPersistent,
		updateBlockAttributes,
		__unstableSetTemporarilyEditingAsBlocks,
	] );

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
					<StopEditingAsBlocksOnOutsideSelect
						clientId={ clientId }
						stopEditingAsBlock={ stopEditingAsBlock }
					/>
					<BlockControls group="other">
						<ToolbarButton
							onClick={ () => {
								stopEditingAsBlock();
							} }
						>
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
								focusModeToRevert.current =
									getSettings().focusMode;
								updateSettings( { focusMode: true } );
								__unstableSetTemporarilyEditingAsBlocks(
									clientId
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
