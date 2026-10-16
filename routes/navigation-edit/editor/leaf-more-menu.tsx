import { chevronUp, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
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

	const removeLabel = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		BlockTitle( { clientId, maximumLength: 25 } )
	);

	const {
		rootClientId,
		blockIndex,
		insertableBlock,
		canDuplicate,
		canInsertBlock,
		isFirst,
		isLast,
	} = useSelect(
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
			const _blockIndex = getBlockIndex( clientId );

			return {
				rootClientId: _rootClientId,
				blockIndex: _blockIndex,
				// What "Add before" and "Add after" insert: the parent's
				// direct-insert block (a Navigation Link in a menu), else
				// the editor's default block.
				insertableBlock: directInsertBlock ?? {
					name: getDefaultBlockName(),
				},
				canDuplicate:
					hasBlockSupport( _blockName, 'multiple', true ) &&
					canInsertBlockType( _blockName, _rootClientId ),
				canInsertBlock:
					( canInsertDefaultBlock || !! directInsertBlock ) &&
					canInsertBlockType( _blockName, _rootClientId ),
				isFirst: _blockIndex === 0,
				isLast: _blockIndex === getBlockCount( _rootClientId ) - 1,
			};
		},
		[ clientId ]
	);

	// Insert a sibling the way the List View appender does: without
	// selecting it, and registering it as the inserted block so its row
	// renders the link popover anchored to itself. Selecting it instead
	// would have the hidden canvas block open its own popover, which has
	// nothing visible to anchor to.
	const insertSibling = ( index: number ) => {
		const block = createBlock(
			insertableBlock.name,
			insertableBlock.attributes
		);
		insertBlock( block, index, rootClientId, false );
		setInsertedBlockClientId( block.clientId );
	};

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
										insertSibling( blockIndex );
										onClose();
									} }
								>
									{ __( 'Add before' ) }
								</MenuItem>
								<MenuItem
									onClick={ () => {
										insertSibling( blockIndex + 1 );
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
