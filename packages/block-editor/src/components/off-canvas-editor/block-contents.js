/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { forwardRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ListViewBlockSelectButton from './block-select-button';
import BlockDraggable from '../block-draggable';
import { store as blockEditorStore } from '../../store';
import { updateAttributes } from './update-attributes';
import { LinkUI } from './link-ui';
import { useInsertedBlock } from './use-inserted-block';
import { useListViewContext } from './context';

const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

const ListViewBlockContents = forwardRef(
	(
		{
			onClick,
			onToggleExpanded,
			block,
			isSelected,
			position,
			siblingBlockCount,
			level,
			isExpanded,
			selectedClientIds,
			...props
		},
		ref
	) => {
		const { clientId } = block;
		const [ isLinkUIOpen, setIsLinkUIOpen ] = useState();
		const {
			blockMovingClientId,
			selectedBlockInBlockEditor,
			lastInsertedBlockClientId,
		} = useSelect(
			( select ) => {
				const {
					hasBlockMovingClientId,
					getSelectedBlockClientId,
					getLastInsertedBlocksClientIds,
				} = unlock( select( blockEditorStore ) );
				const lastInsertedBlocksClientIds =
					getLastInsertedBlocksClientIds();
				return {
					blockMovingClientId: hasBlockMovingClientId(),
					selectedBlockInBlockEditor: getSelectedBlockClientId(),
					lastInsertedBlockClientId:
						lastInsertedBlocksClientIds &&
						lastInsertedBlocksClientIds[ 0 ],
				};
			},
			[ clientId ]
		);

		const {
			insertedBlockAttributes,
			insertedBlockName,
			setInsertedBlockAttributes,
		} = useInsertedBlock( lastInsertedBlockClientId );

		const hasExistingLinkValue = insertedBlockAttributes?.url;

		useEffect( () => {
			if (
				clientId === lastInsertedBlockClientId &&
				BLOCKS_WITH_LINK_UI_SUPPORT?.includes( insertedBlockName ) &&
				! hasExistingLinkValue // don't re-show the Link UI if the block already has a link value.
			) {
				setIsLinkUIOpen( true );
			}
		}, [
			lastInsertedBlockClientId,
			clientId,
			insertedBlockName,
			hasExistingLinkValue,
		] );

		const { renderAdditionalBlockUI } = useListViewContext();

		const isBlockMoveTarget =
			blockMovingClientId && selectedBlockInBlockEditor === clientId;

		const className = classnames( 'block-editor-list-view-block-contents', {
			'is-dropping-before': isBlockMoveTarget,
		} );

		// Only include all selected blocks if the currently clicked on block
		// is one of the selected blocks. This ensures that if a user attempts
		// to drag a block that isn't part of the selection, they're still able
		// to drag it and rearrange its position.
		const draggableClientIds = selectedClientIds.includes( clientId )
			? selectedClientIds
			: [ clientId ];

		return (
			<>
				{ renderAdditionalBlockUI && renderAdditionalBlockUI( block ) }
				{ isLinkUIOpen && (
					<LinkUI
						clientId={ lastInsertedBlockClientId }
						link={ insertedBlockAttributes }
						onClose={ () => setIsLinkUIOpen( false ) }
						hasCreateSuggestion={ false }
						onChange={ ( updatedValue ) => {
							updateAttributes(
								updatedValue,
								setInsertedBlockAttributes,
								insertedBlockAttributes
							);
							setIsLinkUIOpen( false );
						} }
						onCancel={ () => setIsLinkUIOpen( false ) }
					/>
				) }
				<BlockDraggable clientIds={ draggableClientIds }>
					{ ( { draggable, onDragStart, onDragEnd } ) => (
						<ListViewBlockSelectButton
							ref={ ref }
							className={ className }
							block={ block }
							onClick={ onClick }
							onToggleExpanded={ onToggleExpanded }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							draggable={ draggable }
							onDragStart={ onDragStart }
							onDragEnd={ onDragEnd }
							isExpanded={ isExpanded }
							{ ...props }
						/>
					) }
				</BlockDraggable>
			</>
		);
	}
);

export default ListViewBlockContents;
