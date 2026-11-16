import { chevronUp, chevronDown, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import {
	BlockTitle,
	store as blockEditorStore,
	useSettings,
} from '@wordpress/block-editor';
import { hasBlockSupport, store as blocksStore } from '@wordpress/blocks';

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
		moveBlocksDown,
		moveBlocksUp,
		removeBlocks,
		duplicateBlocks,
		insertBeforeBlock,
		insertAfterBlock,
		updateBlockAttributes,
	} = useDispatch( blockEditorStore );
	const [ allowVisibilityEditing ] = useSettings(
		'blockVisibility.allowEditing'
	);

	const removeLabel = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		// The menu is for an existing block, which has a title.
		BlockTitle( { clientId, maximumLength: 25 } ) as string
	);

	const {
		rootClientId,
		canDuplicate,
		canInsertBlock,
		canHide,
		isPage,
		metadata,
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
				getBlockAttributes,
				getBlockEditingMode,
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
					hasBlockSupport( _blockName as string, 'multiple', true ) &&
					canInsertBlockType( _blockName, _rootClientId ),
				canInsertBlock:
					( canInsertDefaultBlock || !! directInsertBlock ) &&
					canInsertBlockType( _blockName, _rootClientId ),
				canHide:
					getBlockEditingMode( clientId ) === 'default' &&
					hasBlockSupport( _blockName as string, 'visibility', true ),
				// A Page List lists every page, so its pages are hidden,
				// not removed or duplicated.
				isPage: _blockName === 'core/page-list-item',
				metadata: getBlockAttributes( clientId )?.metadata as
					Record< string, unknown > | undefined,
				isFirst: getBlockIndex( clientId ) === 0,
				isLast:
					getBlockIndex( clientId ) ===
					getBlockCount( _rootClientId ) - 1,
			};
		},
		[ clientId ]
	);

	const showHide = canHide && allowVisibilityEditing !== false;
	const isHidden = metadata?.blockVisibility === false;
	const toggleHidden = () => {
		const { blockVisibility, ...otherMetadata } = metadata ?? {};
		updateBlockAttributes( clientId, {
			metadata: isHidden
				? otherMetadata
				: { ...otherMetadata, blockVisibility: false },
		} );
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
						{ canDuplicate && ! isPage && (
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
					{ ( showHide || ! isPage ) && (
						<MenuGroup>
							{ showHide && (
								<MenuItem
									onClick={ () => {
										toggleHidden();
										onClose();
									} }
								>
									{ isHidden ? __( 'Show' ) : __( 'Hide' ) }
								</MenuItem>
							) }
							{ ! isPage && (
								<MenuItem
									onClick={ () => {
										removeBlocks( [ clientId ], false );
										onClose();
									} }
								>
									{ removeLabel }
								</MenuItem>
							) }
						</MenuGroup>
					) }
				</>
			) }
		</DropdownMenu>
	);
}
