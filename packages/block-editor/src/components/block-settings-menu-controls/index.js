/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	MenuGroup,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

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
import { ModifyContentOnlySectionMenuItem } from '../content-lock';
import { BlockRenameControl, useBlockRename } from '../block-rename';
import { BlockVisibilityMenuItem } from '../block-visibility';
import { EditSectionMenuItem } from './edit-section-menu-item';

const { Fill, Slot } = createSlotFill( 'BlockSettingsMenuControls' );

const BlockSettingsMenuControlsSlot = ( { fillProps, clientIds = null } ) => {
	const {
		selectedBlocks,
		selectedClientIds,
		isContentOnly,
		canToggleSelectedBlocksVisibility,
		isSectionBlock,
	} = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockNamesByClientId,
				getSelectedBlockClientIds,
				getBlockEditingMode,
			} = select( blockEditorStore );
			const { isSectionBlock: _isSectionBlock } = unlock(
				select( blockEditorStore )
			);
			const ids =
				clientIds !== null ? clientIds : getSelectedBlockClientIds();
			return {
				selectedBlocks: getBlockNamesByClientId( ids ),
				selectedClientIds: ids,
				isContentOnly:
					getBlockEditingMode( ids[ 0 ] ) === 'contentOnly',
				canToggleSelectedBlocksVisibility: getBlocksByClientId(
					ids
				).every( ( block ) =>
					hasBlockSupport( block.name, 'blockVisibility', true )
				),
				isSectionBlock:
					ids.length === 1 ? _isSectionBlock( ids[ 0 ] ) : false,
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
	const showVisibilityButton =
		canToggleSelectedBlocksVisibility && ! isContentOnly;

	// Check if current selection of blocks is Groupable or Ungroupable
	// and pass this props down to ConvertToGroupButton.
	const convertToGroupButtonProps =
		useConvertToGroupButtonProps( selectedClientIds );
	const { isGroupable, isUngroupable } = convertToGroupButtonProps;

	// Don't show ungroup for section blocks when the experiment is enabled
	// since we show "Unlock design" instead
	const shouldShowUngroup =
		isUngroupable &&
		! (
			isSectionBlock && window?.__experimentalContentOnlyPatternInsertion
		);

	const showConvertToGroupButton =
		( isGroupable || shouldShowUngroup ) && ! isContentOnly;

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
								isUngroupable={ shouldShowUngroup }
								onClose={ fillProps?.onClose }
							/>
						) }
						{ selectedClientIds.length === 1 && (
							<EditSectionMenuItem
								clientId={ selectedClientIds[ 0 ] }
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
						{ showVisibilityButton && (
							<BlockVisibilityMenuItem
								clientIds={ selectedClientIds }
							/>
						) }
						{ fills }
						{ selectedClientIds.length === 1 && (
							<ModifyContentOnlySectionMenuItem
								clientId={ selectedClientIds[ 0 ] }
								onClose={ fillProps?.onClose }
							/>
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
