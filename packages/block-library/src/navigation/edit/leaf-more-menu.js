/**
 * WordPress dependencies
 */
import {
	createBlock,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
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

/**
 * Internal dependencies
 */
import { DEFAULT_BLOCK } from '../constants';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	placement: 'bottom-start',
};

const BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU = [
	'core/navigation-link',
	'core/navigation-submenu',
];

function AddSubmenuItem( {
	block,
	onClose,
	expandedState,
	expand,
	setInsertedBlock,
} ) {
	const { insertBlock, replaceBlock, replaceInnerBlocks } =
		useDispatch( blockEditorStore );

	const clientId = block.clientId;
	const isDisabled = ! BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU.includes(
		block.name
	);
	return (
		<MenuItem
			icon={ addSubmenu }
			disabled={ isDisabled }
			onClick={ () => {
				const updateSelectionOnInsert = false;
				const newLink = createBlock(
					DEFAULT_BLOCK.name,
					DEFAULT_BLOCK.attributes
				);

				if ( block.name === 'core/navigation-submenu' ) {
					insertBlock(
						newLink,
						block.innerBlocks.length,
						clientId,
						updateSelectionOnInsert
					);
				} else {
					// Convert to a submenu if the block currently isn't one.
					const newSubmenu = createBlock(
						'core/navigation-submenu',
						block.attributes,
						block.innerBlocks
					);

					// The following must happen as two independent actions.
					// Why? Because the offcanvas editor relies on the getLastInsertedBlocksClientIds
					// selector to determine which block is "active". As the UX needs the newLink to be
					// the "active" block it must be the last block to be inserted.
					// Therefore the Submenu is first created and **then** the newLink is inserted
					// thus ensuring it is the last inserted block.
					replaceBlock( clientId, newSubmenu );

					replaceInnerBlocks(
						newSubmenu.clientId,
						[ newLink ],
						updateSelectionOnInsert
					);
				}

				// This call sets the local List View state for the "last inserted block".
				// This is required for the Nav Block to determine whether or not to display
				// the Link UI for this new block.
				setInsertedBlock( newLink );

				if ( ! expandedState[ block.clientId ] ) {
					expand( block.clientId );
				}
				onClose();
			} }
		>
			{ __( 'Add submenu link' ) }
		</MenuItem>
	);
}

export default function LeafMoreMenu( props ) {
	const { block } = props;
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
						<AddSubmenuItem
							block={ block }
							onClose={ onClose }
							expandedState={ props.expandedState }
							expand={ props.expand }
							setInsertedBlock={ props.setInsertedBlock }
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
