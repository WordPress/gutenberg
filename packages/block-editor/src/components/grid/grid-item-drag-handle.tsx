import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { dragHandle, Icon } from '@wordpress/icons';
import { store as blockEditorStore } from '../../store';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { GridItemHandle } from './grid-item-handle';
import { startGridItemDrag } from './start-grid-item-drag';

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
			draggable
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
			<Icon icon={ dragHandle } />
		</GridItemHandle>
	);
}
