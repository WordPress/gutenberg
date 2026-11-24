import { moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import {
	BlockTitle,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import { unlock } from '@wordpress/routes-lock-unlock';

const { ListViewMoveMenuItems } = unlock( blockEditorPrivateApis );

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	placement: 'bottom-start',
} as const;

export default function LeafMoreMenu( {
	clientId,
	...props
}: {
	clientId: string;
} ) {
	const {
		removeBlocks,
		duplicateBlocks,
		insertBeforeBlock,
		insertAfterBlock,
	} = useDispatch( blockEditorStore );

	const removeLabel = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		// The menu is for an existing block, which has a title.
		BlockTitle( { clientId, maximumLength: 25 } ) as string
	);

	const { canDuplicate, canInsertBlock } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockName,
				canInsertBlockType,
				getDirectInsertBlock,
			} = select( blockEditorStore );
			const { getDefaultBlockName } = select( blocksStore );

			const _rootClientId = getBlockRootClientId( clientId );
			const _blockName = getBlockName( clientId );
			const canInsertDefaultBlock = canInsertBlockType(
				getDefaultBlockName(),
				_rootClientId
			);
			const directInsertBlock = _rootClientId
				? getDirectInsertBlock( _rootClientId )
				: null;

			return {
				canDuplicate:
					// The menu is for an existing block, which has a name.
					hasBlockSupport( _blockName as string, 'multiple', true ) &&
					canInsertBlockType( _blockName, _rootClientId ),
				canInsertBlock:
					( canInsertDefaultBlock || !! directInsertBlock ) &&
					canInsertBlockType( _blockName, _rootClientId ),
			};
		},
		[ clientId ]
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
						<ListViewMoveMenuItems
							clientIds={ [ clientId ] }
							onClose={ onClose }
						/>
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
