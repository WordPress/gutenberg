import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { dragHandle } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { GridItemHandle } from './grid-item-handle';
import {
	startGridItemDrag,
	startGridItemPointerDrag,
} from './start-grid-item-drag';

interface GridItemDragHandleProps {
	/** Client ID of the grid item. */
	clientId: string;
	/** Client ID of the grid. */
	gridClientId: string;
}

/**
 * A handle for dragging a selected grid item to other cells, in its toolbar of
 * handles.
 *
 * Most blocks can be dragged by their body, but in blocks such as Paragraph
 * or Heading, a press on the body places the caret or selects text instead.
 * The handle moves any block the same way its body does: the block stays in
 * place, dimmed, while the grid shows where it will land.
 */
export function GridItemDragHandle( {
	clientId,
	gridClientId,
}: GridItemDragHandleProps ) {
	const blockElement = useBlockElement( clientId ) as HTMLElement | null;
	const { startDraggingBlocks, stopDraggingBlocks } =
		useDispatch( blockEditorStore );

	if ( ! blockElement ) {
		return null;
	}

	return (
		// Keyboard users move blocks with the movers in the block toolbar.
		<GridItemHandle
			className="block-editor-grid-item-handles__drag"
			label={ __( 'Drag' ) }
			icon={ dragHandle }
			draggable
			onPointerDown={ ( event ) => {
				// Touch screens don't start the browser's drag and drop from
				// the handle, so a touch drag follows the touch instead.
				if ( event.pointerType !== 'touch' ) {
					return;
				}
				startGridItemPointerDrag( event.nativeEvent, {
					clientId,
					blockElement,
					handle: event.currentTarget,
					startDraggingBlocks,
					stopDraggingBlocks,
				} );
			} }
			onDragStart={ ( event ) => {
				startGridItemDrag( event.nativeEvent, {
					clientId,
					rootClientId: gridClientId,
					blockElement,
					startDraggingBlocks,
					stopDraggingBlocks,
					isHandle: true,
				} );
			} }
		/>
	);
}
