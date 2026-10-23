export interface UseDropZoneProps {
	/**
	 * Optional element to be used as the drop zone.
	 */
	dropZoneElement?: HTMLElement | null;
	/**
	 * Whether or not to disable the drop zone.
	 */
	isDisabled?: boolean;
	/**
	 * Called when dragging has started, on the first `dragenter` or
	 * `dragover` in the document. A drag can start on a `dragover`, as
	 * browsers can skip the `dragenter` in an iframe.
	 */
	onDragStart?: ( e: DragEvent ) => void;
	/**
	 *  Called when the zone is entered.
	 */
	onDragEnter?: ( e: DragEvent ) => void;
	/**
	 * Called when the zone is moved within.
	 */
	onDragOver?: ( e: DragEvent ) => void;
	/**
	 * Called when the zone is left.
	 */
	onDragLeave?: ( e: DragEvent ) => void;
	/**
	 * Called when dragging has ended, on a `dragend` or a drop in the zone,
	 * or on the first `mousemove` with no button held, for drags that end
	 * outside the document.
	 */
	onDragEnd?: ( e: MouseEvent ) => void;
	/**
	 * Called when dropping in the zone.
	 */
	onDrop?: ( e: DragEvent ) => void;
}
