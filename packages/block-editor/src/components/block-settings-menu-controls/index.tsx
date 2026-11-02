import {
	createSlotFill,
	MenuGroup,
	__experimentalStyleProvider as StyleProvider,
} from '@wordpress/components';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import type { ComponentProps } from 'react';
import type { Block } from '@wordpress/blocks';
import {
	useConvertToGroupButtonProps,
	ConvertToGroupButton,
} from '../convert-to-group-buttons';
import { BlockLockMenuItem, useBlockLock } from '../block-lock';
import { store as blockEditorStore } from '../../store';
import BlockModeToggle from '../block-settings-menu/block-mode-toggle';
import { BlockRenameControl, useBlockRename } from '../block-rename';
import { BlockVisibilityViewportMenuItem } from '../block-visibility';
import type {
	BlockSettingsMenuControlsProps,
	BlockSettingsMenuControlsSlotProps,
} from './types';

const { Fill, Slot } = createSlotFill( 'BlockSettingsMenuControls' );

const BlockSettingsMenuControlsSlot = ( {
	fillProps,
	clientIds = null,
}: BlockSettingsMenuControlsSlotProps ) => {
	const {
		selectedBlocks,
		selectedClientIds,
		isContentOnly,
		canToggleSelectedBlocksVisibility,
		canEdit,
	} = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockNamesByClientId,
				getSelectedBlockClientIds,
				getBlockEditingMode,
				canEditBlock,
			} = select( blockEditorStore );
			const ids =
				clientIds !== null ? clientIds : getSelectedBlockClientIds();
			return {
				selectedBlocks: getBlockNamesByClientId( ids ),
				selectedClientIds: ids,
				isContentOnly:
					getBlockEditingMode( ids[ 0 ] ) === 'contentOnly',
				// The selected blocks exist.
				canToggleSelectedBlocksVisibility: (
					getBlocksByClientId( ids ) as Block[]
				 ).every( ( block ) =>
					hasBlockSupport( block.name, 'visibility', true )
				),
				canEdit: canEditBlock( ids[ 0 ] ),
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
	const showConvertToGroupButton =
		( isGroupable || isUngroupable ) && ! isContentOnly;

	return (
		<Slot
			fillProps={ {
				...fillProps,
				canEdit,
				selectedBlocks,
				selectedClientIds,
			} }
		>
			{ ( fills ) => {
				if (
					// @ts-expect-error Compares the negated fill count with 0, true without fills.
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
						{ canEdit && showLockButton && (
							<BlockLockMenuItem
								clientId={ selectedClientIds[ 0 ] }
							/>
						) }
						{ canEdit && showRenameButton && (
							<BlockRenameControl
								clientId={ selectedClientIds[ 0 ] }
							/>
						) }
						{ canEdit && showVisibilityButton && (
							<BlockVisibilityViewportMenuItem
								clientIds={ selectedClientIds }
							/>
						) }
						{ fills }
						{ canEdit &&
							fillProps?.count === 1 &&
							! isContentOnly && (
								<BlockModeToggle
									// The menu of a single block passes its client ID.
									clientId={
										fillProps?.firstBlockClientId as string
									}
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
function BlockSettingsMenuControls( {
	...props
}: BlockSettingsMenuControlsProps ) {
	return (
		<StyleProvider document={ document }>
			<Fill
				// The slot passes the fill props the children are typed with.
				{ ...( props as ComponentProps< typeof Fill > ) }
			/>
		</StyleProvider>
	);
}

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlot;

export default BlockSettingsMenuControls;
