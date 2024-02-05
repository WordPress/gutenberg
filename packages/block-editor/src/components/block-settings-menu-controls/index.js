/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	privateApis as componentsPrivateApis,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
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
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

const { Fill, Slot } = createSlotFill( 'BlockSettingsMenuControls' );

const BlockSettingsMenuControlsSlot = ( {
	fillProps,
	clientIds = null,
	__unstableDisplayLocation,
} ) => {
	const { selectedBlocks, selectedClientIds } = useSelect(
		( select ) => {
			const { getBlockNamesByClientId, getSelectedBlockClientIds } =
				select( blockEditorStore );
			const ids =
				clientIds !== null ? clientIds : getSelectedBlockClientIds();
			return {
				selectedBlocks: getBlockNamesByClientId( ids ),
				selectedClientIds: ids,
			};
		},
		[ clientIds ]
	);

	const { canLock } = useBlockLock( selectedClientIds[ 0 ] );
	const { canRename } = useBlockRename( selectedBlocks[ 0 ] );
	const showLockButton = selectedClientIds.length === 1 && canLock;
	const showRenameButton = selectedClientIds.length === 1 && canRename;

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
				__unstableDisplayLocation,
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
					<>
						{ /* TODO: check if this used in other legacy dropdown
						menus */ }
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							{ showConvertToGroupButton && (
								<ConvertToGroupButton
									{ ...convertToGroupButtonProps }
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
							{ fillProps?.canMove && ! fillProps?.onlyBlock && (
								<DropdownMenuItem
									onClick={ fillProps?.onMoveTo }
								>
									<DropdownMenuItemLabel>
										{ __( 'Move to' ) }
									</DropdownMenuItemLabel>
								</DropdownMenuItem>
							) }
							{ fillProps?.count === 1 && (
								<BlockModeToggle
									clientId={ fillProps?.firstBlockClientId }
								/>
							) }
						</DropdownMenuGroup>
					</>
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
	// TODO: forward dropdown menu context
	return (
		<StyleProvider document={ document }>
			<Fill { ...props } />
		</StyleProvider>
	);
}

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlot;

export default BlockSettingsMenuControls;
