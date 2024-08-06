/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { dragHandle, trash } from '@wordpress/icons';
import { Button, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockDraggable from '../block-draggable';
import BlockMover from '../block-mover';
import Shuffle from '../block-toolbar/shuffle';
import NavigableToolbar from '../navigable-toolbar';

export default function ZoomOutToolbar( { clientId, rootClientId } ) {
	const selected = useSelect(
		( select ) => {
			const {
				getBlock,
				hasBlockMovingClientId,
				getNextBlockClientId,
				getPreviousBlockClientId,
				canRemoveBlock,
				canMoveBlock,
			} = select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			const { name } = getBlock( clientId );
			const blockType = getBlockType( name );
			const isBlockTemplatePart =
				blockType?.name === 'core/template-part';

			let isNextBlockTemplatePart = false;
			const nextClientId = getNextBlockClientId();
			if ( nextClientId ) {
				const { name: nextName } = getBlock( nextClientId );
				const nextBlockType = getBlockType( nextName );
				isNextBlockTemplatePart =
					nextBlockType?.name === 'core/template-part';
			}

			let isPrevBlockTemplatePart = false;
			const prevClientId = getPreviousBlockClientId();
			if ( prevClientId ) {
				const { name: prevName } = getBlock( prevClientId );
				const prevBlockType = getBlockType( prevName );
				isPrevBlockTemplatePart =
					prevBlockType?.name === 'core/template-part';
			}

			return {
				blockMovingMode: hasBlockMovingClientId(),
				isBlockTemplatePart,
				isNextBlockTemplatePart,
				isPrevBlockTemplatePart,
				canRemove: canRemoveBlock( clientId, rootClientId ),
				canMove: canMoveBlock( clientId, rootClientId ),
			};
		},
		[ clientId, rootClientId ]
	);

	const {
		blockMovingMode,
		isBlockTemplatePart,
		isNextBlockTemplatePart,
		isPrevBlockTemplatePart,
		canRemove,
		canMove,
	} = selected;

	const { removeBlock } = useDispatch( blockEditorStore );

	const classNames = clsx( 'zoom-out-toolbar', {
		'is-block-moving-mode': !! blockMovingMode,
	} );

	const showBlockDraggable = canMove && ! isBlockTemplatePart;

	return (
		<NavigableToolbar
			className={ classNames }
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block tools' ) }
			// The variant is applied as "toolbar" when undefined, which is the black border style of the dropdown from the toolbar popover.
			variant="unstyled"
			orientation="vertical"
		>
			{ showBlockDraggable && (
				<BlockDraggable clientIds={ [ clientId ] }>
					{ ( draggableProps ) => (
						<Button
							icon={ dragHandle }
							className="block-selection-button_drag-handle zoom-out-toolbar-button"
							label={ __( 'Drag' ) }
							iconSize={ 24 }
							size="compact"
							// Should not be able to tab to drag handle as this
							// button can only be used with a pointer device.
							tabIndex="-1"
							{ ...draggableProps }
						/>
					) }
				</BlockDraggable>
			) }
			{ ! isBlockTemplatePart && (
				<BlockMover
					clientIds={ [ clientId ] }
					hideDragHandle
					isBlockMoverUpButtonDisabled={ isPrevBlockTemplatePart }
					isBlockMoverDownButtonDisabled={ isNextBlockTemplatePart }
					iconSize={ 24 }
					size="compact"
				/>
			) }
			{ canMove && canRemove && (
				<Shuffle clientId={ clientId } as={ ToolbarButton } />
			) }
			{ canRemove && ! isBlockTemplatePart && (
				<ToolbarButton
					className="zoom-out-toolbar-button"
					icon={ trash }
					label={ __( 'Delete' ) }
					onClick={ () => {
						removeBlock( clientId );
					} }
				/>
			) }
		</NavigableToolbar>
	);
}
