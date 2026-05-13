/**
 * WordPress dependencies
 */

import { chevronUp, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
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
	...props
}: {
	block: { clientId: string; name: string };
} ) {
	const { clientId } = block;
	const {
		moveBlocksDown,
		moveBlocksUp,
		removeBlocks,
		duplicateBlocks,
		insertBeforeBlock,
		insertAfterBlock,
	} = useDispatch( blockEditorStore );

	const removeLabel = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		BlockTitle( { clientId, maximumLength: 25 } )
	);

	const { rootClientId, canDuplicate, canInsertBlock, isFirst, isLast } =
		useSelect(
			( select ) => {
				const {
					getBlockRootClientId,
					canInsertBlockType,
					getDirectInsertBlock,
					getBlockIndex,
					getBlockCount,
				} = select( blockEditorStore );
				const { getDefaultBlockName } = select( blocksStore );

				const _rootClientId = getBlockRootClientId( clientId );
				const canInsertDefaultBlock = canInsertBlockType(
					getDefaultBlockName(),
					_rootClientId
				);
				const directInsertBlock = _rootClientId
					? getDirectInsertBlock( _rootClientId )
					: null;

				return {
					rootClientId: _rootClientId,
					canDuplicate:
						!! block &&
						hasBlockSupport( block.name, 'multiple', true ) &&
						canInsertBlockType( block.name, _rootClientId ),
					canInsertBlock:
						( canInsertDefaultBlock || !! directInsertBlock ) &&
						!! block &&
						canInsertBlockType( block.name, _rootClientId ),
					isFirst: getBlockIndex( clientId ) === 0,
					isLast:
						getBlockIndex( clientId ) ===
						getBlockCount( _rootClientId ) - 1,
				};
			},
			[ clientId, block ]
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
							disabled={ isFirst }
							accessibleWhenDisabled
							onClick={ () => {
								moveBlocksUp( [ clientId ], rootClientId );
								onClose();
							} }
						>
							{ __( 'Move up' ) }
						</MenuItem>
						<MenuItem
							icon={ chevronDown }
							disabled={ isLast }
							accessibleWhenDisabled
							onClick={ () => {
								moveBlocksDown( [ clientId ], rootClientId );
								onClose();
							} }
						>
							{ __( 'Move down' ) }
						</MenuItem>
						{ canDuplicate && (
							<MenuItem
								onClick={ () => {
									duplicateBlocks( [ clientId ] );
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
										insertBeforeBlock( clientId );
										onClose();
									} }
								>
									{ __( 'Add before' ) }
								</MenuItem>
								<MenuItem
									onClick={ () => {
										insertAfterBlock( clientId );
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
							onClick={ () => {
								removeBlocks( [ clientId ], false );
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
