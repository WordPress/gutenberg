import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getInserterDragBlockNames } from './utils';

const NO_NAMES: string[] = [];

/**
 * Gets the names of the blocks dragged from an inserter, while they are
 * dragged. A grid needs them before the pointer reaches it, to know whether
 * its drop layer should take the drop, so they are read from the drag events
 * of the canvas and of the editor around it.
 *
 * They stay until the drag ends, and not only while the pointer is over the
 * grid: the grid's drop layer covers the grid from the editor's document, so
 * the grid gets a `dragleave` as soon as the layer takes the drag.
 *
 * @param gridElement The grid element, or nothing to read no names.
 *
 * @return The block names, or none when no blocks are dragged from an
 *         inserter.
 */
export function useInserterDragBlockNames(
	gridElement: Element | null | undefined
): string[] {
	const isInserterDrag = useSelect( ( select ) => {
		const { isDragging, isDraggingBlocks } = unlock(
			select( blockEditorStore )
		);
		return isDragging() && ! isDraggingBlocks();
	}, [] );
	const [ names, setNames ] = useState( NO_NAMES );

	useEffect( () => {
		if ( ! isInserterDrag || ! gridElement ) {
			setNames( NO_NAMES );
			return;
		}
		const documents = new Set( [ gridElement.ownerDocument, document ] );
		function onDragEvent( event: Event ) {
			const nextNames = getInserterDragBlockNames(
				( event as DragEvent ).dataTransfer
			);
			if ( ! nextNames.length ) {
				return;
			}
			setNames( ( currentNames ) =>
				currentNames.join() === nextNames.join()
					? currentNames
					: nextNames
			);
		}
		for ( const ownerDocument of documents ) {
			ownerDocument.addEventListener( 'dragenter', onDragEvent, true );
			ownerDocument.addEventListener( 'dragover', onDragEvent, true );
		}
		return () => {
			for ( const ownerDocument of documents ) {
				ownerDocument.removeEventListener(
					'dragenter',
					onDragEvent,
					true
				);
				ownerDocument.removeEventListener(
					'dragover',
					onDragEvent,
					true
				);
			}
		};
	}, [ isInserterDrag, gridElement ] );

	return names;
}
