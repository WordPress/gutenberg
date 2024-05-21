/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	MenuGroup,
	MenuItem,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { pipe } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	useConvertToGroupButtonProps,
	ConvertToGroupButton,
} from '../convert-to-group-buttons';
import { BlockLockMenuItem, useBlockLock } from '../block-lock';
import { store as blockEditorStore } from '../../store';
import BlockModeToggle from '../block-settings-menu/block-mode-toggle';

import { BlockRenameControl, useBlockRename } from '../block-rename';

const { Fill, Slot } = createSlotFill( 'BlockSettingsMenuControls' );

const BlockSettingsMenuControlsSlot = ( { fillProps, clientIds = null } ) => {
	const { selectedBlocks, selectedClientIds, isContentOnly } = useSelect(
		( select ) => {
			const {
				getBlockNamesByClientId,
				getSelectedBlockClientIds,
				getBlockEditingMode,
			} = select( blockEditorStore );
			const ids =
				clientIds !== null ? clientIds : getSelectedBlockClientIds();
			return {
				selectedBlocks: getBlockNamesByClientId( ids ),
				selectedClientIds: ids,
				isContentOnly:
					getBlockEditingMode( ids[ 0 ] ) === 'contentOnly',
			};
		},
		[ clientIds ]
	);

	const { canLock } = useBlockLock( selectedClientIds[ 0 ] );
	const { canRename } = useBlockRename( selectedBlocks[ 0 ] );
	const showLockButton =
		selectedClientIds.length === 1 && canLock && ! isContentOnly;
	const showRenameButton =
		selectedClientIds.length === 1 && canRename && ! isContentOnly;

	// Check if current selection of blocks is Groupable or Ungroupable
	// and pass this props down to ConvertToGroupButton.
	const convertToGroupButtonProps =
		useConvertToGroupButtonProps( selectedClientIds );
	const { isGroupable, isUngroupable } = convertToGroupButtonProps;
	const showConvertToGroupButton = isGroupable || isUngroupable;

	return (
		<Slot
			fillProps={ {
				...fillProps,
				selectedBlocks,
				selectedClientIds,
			} }
		>
			{ ( fills ) => {
				if (
					! fills?.length > 0 &&
					! showConvertToGroupButton &&
					! showLockButton
				) {
					return null;
				}

				return (
					<MenuGroup>
						{ showConvertToGroupButton && (
							<ConvertToGroupButton
								{ ...convertToGroupButtonProps }
								onClose={ fillProps?.onClose }
							/>
						) }
						{ showLockButton && (
							<BlockLockMenuItem
								clientId={ selectedClientIds[ 0 ] }
							/>
						) }
						{ showRenameButton && (
							<BlockRenameControl
								clientId={ selectedClientIds[ 0 ] }
							/>
						) }
						{ fills }
						{ fillProps?.canMove &&
							! fillProps?.onlyBlock &&
							! isContentOnly && (
								<MenuItem
									onClick={ pipe(
										fillProps?.onClose,
										fillProps?.onMoveTo
									) }
								>
									{ __( 'Move to' ) }
								</MenuItem>
							) }
						{ fillProps?.count === 1 && ! isContentOnly && (
							<BlockModeToggle
								clientId={ fillProps?.firstBlockClientId }
								onToggle={ fillProps?.onClose }
							/>
						) }
					</MenuGroup>
				);
			} }
		</Slot>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-settings-menu-controls/README.md
 *
 * @param {Object} props Fill props.
 * @return {Element} Element.
 */
function BlockSettingsMenuControls( { ...props } ) {
	return (
		<StyleProvider document={ document }>
			<Fill { ...props } />
		</StyleProvider>
	);
}

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlot;

export default BlockSettingsMenuControls;
