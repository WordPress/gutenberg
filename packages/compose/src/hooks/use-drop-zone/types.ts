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
	 * Called when dragging has started.
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
	 * Called when dragging has ended.
	 */
	onDragEnd?: ( e: MouseEvent ) => void;
	/**
	 * Called when dropping in the zone.
	 */
	onDrop?: ( e: DragEvent ) => void;
}
