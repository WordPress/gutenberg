/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	__experimentalStyleProvider as StyleProvider,
	privateApis as componentsPrivateApis,
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
import { unlock } from '../../lock-unlock';

const { Fill, Slot } = createSlotFill( 'BlockSettingsMenuControls' );

const { DropdownMenuGroupV2, DropdownMenuItemV2 } = unlock(
	componentsPrivateApis
);

const BlockSettingsMenuControlsSlot = ( {
	fillProps,
	clientIds = null,
	__unstableDisplayLocation,
} ) => {
	const { selectedBlocks, selectedClientIds, canRemove } = useSelect(
		( select ) => {
			const {
				getBlockNamesByClientId,
				getSelectedBlockClientIds,
				canRemoveBlocks,
			} = select( blockEditorStore );
			const ids =
				clientIds !== null ? clientIds : getSelectedBlockClientIds();
			return {
				selectedBlocks: getBlockNamesByClientId( ids ),
				selectedClientIds: ids,
				canRemove: canRemoveBlocks( ids ),
			};
		},
		[ clientIds ]
	);

	const { canLock } = useBlockLock( selectedClientIds[ 0 ] );
	const showLockButton = selectedClientIds.length === 1 && canLock;

	// Check if current selection of blocks is Groupable or Ungroupable
	// and pass this props down to ConvertToGroupButton.
	const convertToGroupButtonProps =
		useConvertToGroupButtonProps( selectedClientIds );
	const { isGroupable, isUngroupable } = convertToGroupButtonProps;
	const showConvertToGroupButton =
		( isGroupable || isUngroupable ) && canRemove;

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
					// TODO: separator?
					// TODO: check if this used in other legacy dropdown menus
					<DropdownMenuGroupV2>
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
						{ fills }
						{ fillProps?.canMove && ! fillProps?.onlyBlock && (
							<DropdownMenuItemV2
								onSelect={ pipe(
									// TODO: onclose?
									// fillProps?.onClose,
									fillProps?.onMoveTo
								) }
							>
								{ __( 'Move to' ) }
							</DropdownMenuItemV2>
						) }
						{ fillProps?.count === 1 && (
							<BlockModeToggle
								clientId={ fillProps?.firstBlockClientId }
								onToggle={ fillProps?.onClose }
							/>
						) }
					</DropdownMenuGroupV2>
				);
			} }
		</Slot>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-settings-menu-controls/README.md
 *
 * @param {Object} props Fill props.
 * @return {WPElement} Element.
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
