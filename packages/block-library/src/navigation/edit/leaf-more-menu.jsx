import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';
import {
	addSubmenu,
	chevronUp,
	chevronDown,
	moreVertical,
} from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { BlockTitle, store as blockEditorStore } from '@wordpress/block-editor';
import {
	BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU,
	useAddSubmenuLink,
} from './use-add-submenu-link';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	placement: 'bottom-start',
};

/**
 * The menu item that adds a link inside a Navigation item, turning a link into
 * a submenu first. It is disabled for blocks that cannot become a submenu.
 *
 * @param {Object}                       props
 * @param {string}                       props.clientId                 The item's block.
 * @param {() => void}                   props.onClose                  Closes the menu.
 * @param {( action: Object ) => void}   props.updateExpansion          Expands or collapses List View rows.
 * @param {( clientId: string ) => void} props.setInsertedBlockClientId Marks the new link as just inserted, which opens its Link UI.
 */
export function AddSubmenuItem( {
	clientId,
	onClose,
	updateExpansion,
	setInsertedBlockClientId,
} ) {
	const addSubmenuLink = useAddSubmenuLink( clientId, {
		updateExpansion,
		setInsertedBlockClientId,
	} );
	const isDisabled = useSelect(
		( select ) =>
			! BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU.includes(
				select( blockEditorStore ).getBlockName( clientId )
			),
		[ clientId ]
	);

	return (
		<MenuItem
			icon={ addSubmenu }
			disabled={ isDisabled }
			onClick={ () => {
				addSubmenuLink();
				onClose();
			} }
		>
			{ __( 'Add submenu link' ) }
		</MenuItem>
	);
}

export default function LeafMoreMenu( {
	clientId,
	updateExpansion,
	setInsertedBlockClientId,
	...props
} ) {
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
					getBlockName,
					canInsertBlockType,
					getDirectInsertBlock,
					getBlockIndex,
					getBlockCount,
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
					rootClientId: _rootClientId,
					canDuplicate:
						!! _blockName &&
						hasBlockSupport( _blockName, 'multiple', true ) &&
						canInsertBlockType( _blockName, _rootClientId ),
					canInsertBlock:
						( canInsertDefaultBlock || !! directInsertBlock ) &&
						!! _blockName &&
						canInsertBlockType( _blockName, _rootClientId ),
					isFirst: getBlockIndex( clientId ) === 0,
					isLast:
						getBlockIndex( clientId ) ===
						getBlockCount( _rootClientId ) - 1,
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
						<AddSubmenuItem
							clientId={ clientId }
							onClose={ onClose }
							updateExpansion={ updateExpansion }
							setInsertedBlockClientId={
								setInsertedBlockClientId
							}
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
