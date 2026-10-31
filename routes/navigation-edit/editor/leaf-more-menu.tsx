import { chevronUp, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { BlockTitle, store as blockEditorStore } from '@wordpress/block-editor';
import {
	createBlock,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	placement: 'bottom-start',
} as const;

export default function LeafMoreMenu( {
	clientId,
	setInsertedBlockClientId,
	...props
}: {
	clientId: string;
	setInsertedBlockClientId: ( clientId: string | null ) => void;
} ) {
	const {
		moveBlocksDown,
		moveBlocksUp,
		removeBlocks,
		duplicateBlocks,
		insertBlock,
	} = useDispatch( blockEditorStore );
	const blockEditorSelectors = useSelect( blockEditorStore );
	const blocksSelectors = useSelect( blocksStore );

	// The block editor is rendered hidden, so a block selected on insertion
	// opens its own link UI with nothing visible to anchor to. Insert without
	// selecting and let the List View open the link UI on the row instead.
	const insertSibling = ( offset: number ) => {
		const { defaultBlock } =
			blockEditorSelectors.getBlockListSettings( rootClientId ) ?? {};
		const blockName =
			defaultBlock?.name ?? blocksSelectors.getDefaultBlockName();
		if ( ! blockName ) {
			return;
		}
		const block = createBlock( blockName, defaultBlock?.attributes );
		const updateSelectionOnInsert = false;
		insertBlock(
			block,
			blockEditorSelectors.getBlockIndex( clientId ) + offset,
			rootClientId,
			updateSelectionOnInsert
		);
		setInsertedBlockClientId( block.clientId );
	};

	const removeLabel = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		// The menu is for an existing block, which has a title.
		BlockTitle( { clientId, maximumLength: 25 } ) as string
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
						// The menu is for an existing block, which has a name.
						hasBlockSupport(
							_blockName as string,
							'multiple',
							true
						) && canInsertBlockType( _blockName, _rootClientId ),
					canInsertBlock:
						( canInsertDefaultBlock || !! directInsertBlock ) &&
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
										insertSibling( 0 );
										onClose();
									} }
								>
									{ __( 'Add before' ) }
								</MenuItem>
								<MenuItem
									onClick={ () => {
										insertSibling( 1 );
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
