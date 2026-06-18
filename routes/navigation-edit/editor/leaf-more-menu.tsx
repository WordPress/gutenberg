/**
 * WordPress dependencies
 */
import { chevronDown, chevronUp, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
import { BlockTitle, store as blockEditorStore } from '@wordpress/block-editor';
import {
	hasBlockSupport,
	store as blocksStore,
	// @ts-expect-error - No type declarations available for @wordpress/blocks
} from '@wordpress/blocks';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	placement: 'bottom-start',
};

export default function LeafMoreMenu( {
	block,
	clientIds,
	...props
}: {
	block: { clientId: string; name: string };
	clientIds?: string[];
} ) {
	const selectedClientIds = useMemo(
		() => ( clientIds?.length ? clientIds : [ block.clientId ] ),
		[ block.clientId, clientIds ]
	);
	const firstClientId = selectedClientIds[ 0 ];
	const lastClientId = selectedClientIds[ selectedClientIds.length - 1 ];
	const isBulkSelection = selectedClientIds.length > 1;
	const {
		moveBlocksDown,
		moveBlocksUp,
		removeBlocks,
		duplicateBlocks,
		insertBeforeBlock,
		insertAfterBlock,
	} = useDispatch( blockEditorStore );

	const firstBlockTitle = BlockTitle( {
		clientId: firstClientId,
		maximumLength: 25,
	} );
	const removeLabel = isBulkSelection
		? sprintf(
				/* translators: %s: number of selected menu items */
				__( 'Remove %s items' ),
				selectedClientIds.length
		  )
		: sprintf(
				/* translators: %s: block name */
				__( 'Remove %s' ),
				firstBlockTitle
		  );

	const {
		rootClientId,
		canDuplicate,
		canInsertBlock,
		canMove,
		canRemove,
		isFirst,
		isLast,
	} = useSelect(
		( select ) => {
			const {
				canInsertBlockType,
				canMoveBlocks,
				canRemoveBlocks,
				getBlock,
				getBlockCount,
				getBlockIndex,
				getBlockRootClientId,
				getBlocksByClientId,
				getDirectInsertBlock,
			} = select( blockEditorStore );
			const { getDefaultBlockName } = select( blocksStore );

			const _rootClientId = getBlockRootClientId( firstClientId );
			const blocks = getBlocksByClientId( selectedClientIds );
			const canInsertDefaultBlock = canInsertBlockType(
				getDefaultBlockName(),
				_rootClientId
			);
			const directInsertBlock = _rootClientId
				? getDirectInsertBlock( _rootClientId )
				: null;
			const selectionIsSameParent = selectedClientIds.every(
				( clientId ) =>
					getBlockRootClientId( clientId ) === _rootClientId
			);

			return {
				rootClientId: _rootClientId,
				canDuplicate:
					selectionIsSameParent &&
					blocks.every(
						( selectedBlock ) =>
							!! selectedBlock &&
							hasBlockSupport(
								selectedBlock.name,
								'multiple',
								true
							) &&
							canInsertBlockType(
								selectedBlock.name,
								_rootClientId
							)
					),
				canInsertBlock:
					selectedClientIds.length === 1 &&
					( canInsertDefaultBlock || !! directInsertBlock ) &&
					!! getBlock( firstClientId ) &&
					canInsertBlockType(
						getBlock( firstClientId )?.name,
						_rootClientId
					),
				canMove:
					selectionIsSameParent && canMoveBlocks( selectedClientIds ),
				canRemove: canRemoveBlocks( selectedClientIds ),
				isFirst: getBlockIndex( firstClientId ) === 0,
				isLast:
					getBlockIndex( lastClientId ) ===
					getBlockCount( _rootClientId ) - 1,
			};
		},
		[ firstClientId, lastClientId, selectedClientIds ]
	);

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Options' ) }
			className="block-editor-block-settings-menu"
			popoverProps={ POPOVER_PROPS }
			noIcons
			{ ...props }
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItem
							icon={ chevronUp }
							disabled={ ! canMove || isFirst }
							accessibleWhenDisabled
							onClick={ () => {
								moveBlocksUp( selectedClientIds, rootClientId );
								onClose();
							} }
						>
							{ __( 'Move up' ) }
						</MenuItem>
						<MenuItem
							icon={ chevronDown }
							disabled={ ! canMove || isLast }
							accessibleWhenDisabled
							onClick={ () => {
								moveBlocksDown(
									selectedClientIds,
									rootClientId
								);
								onClose();
							} }
						>
							{ __( 'Move down' ) }
						</MenuItem>
						{ canDuplicate && (
							<MenuItem
								onClick={ () => {
									duplicateBlocks( selectedClientIds );
									onClose();
								} }
							>
								{ __( 'Duplicate' ) }
							</MenuItem>
						) }
						{ canInsertBlock && (
							<>
								<MenuItem
									onClick={ () => {
										insertBeforeBlock( firstClientId );
										onClose();
									} }
								>
									{ __( 'Add before' ) }
								</MenuItem>
								<MenuItem
									onClick={ () => {
										insertAfterBlock( firstClientId );
										onClose();
									} }
								>
									{ __( 'Add after' ) }
								</MenuItem>
							</>
						) }
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							disabled={ ! canRemove }
							accessibleWhenDisabled
							onClick={ () => {
								removeBlocks( selectedClientIds, false );
								onClose();
							} }
						>
							{ removeLabel }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
