import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { dragHandle, Icon } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { startGridItemDrag } from './start-grid-item-drag';
import { useRotatedOverlayStyle } from './use-rotated-overlay-style';

interface GridItemDragHandleProps {
	/** Client ID of the grid item. */
	clientId: string;
	/** Client ID of the grid. */
	gridClientId: string;
	/** Rotation of the grid item in degrees, so the handle turns with it. */
	angle: number;
}

/**
 * A handle above a selected grid item for dragging it to other cells.
 *
 * Most blocks can be dragged by their body, but in blocks such as Paragraph
 * or Heading, a press on the body places the caret or selects text instead.
 * The handle moves any block the same way its body does: the block stays in
 * place, dimmed, while the grid shows where it will land.
 */
export function GridItemDragHandle( {
	clientId,
	gridClientId,
	angle,
}: GridItemDragHandleProps ) {
	const blockElement = useBlockElement( clientId ) as HTMLElement | null;
	const overlayStyle = useRotatedOverlayStyle( blockElement, angle );
	const { startDraggingBlocks, stopDraggingBlocks } =
		useDispatch( blockEditorStore );

	if ( ! blockElement ) {
		return null;
	}

	return (
		<BlockPopoverCover
			className="block-editor-grid-item-handles"
			clientId={ clientId }
			__unstablePopoverSlot="__unstable-block-tools-after"
			additionalStyles={ overlayStyle }
		>
			<div className="block-editor-grid-item-handles__box">
				<div
					className="block-editor-grid-item-handles__drag"
					title={ __( 'Drag' ) }
					draggable
					// The handle only works with a pointer. Keyboard users
					// move blocks with the movers in the block toolbar.
					aria-hidden="true"
					onDragStart={ ( event ) => {
						startGridItemDrag( event.nativeEvent, {
							clientId,
							rootClientId: gridClientId,
							blockElement,
							startDraggingBlocks,
							stopDraggingBlocks,
						} );
					} }
				>
					<Icon icon={ dragHandle } size={ 16 } />
				</div>
			</div>
		</BlockPopoverCover>
	);
}
