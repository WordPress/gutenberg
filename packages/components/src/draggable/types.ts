/**
 * External dependencies
 */
import type { DragEvent, ReactNode } from 'react';

export type DraggableProps = {
	/**
	 * Children.
	 */
	children: ( props: {
		/**
		 * `onDragStart` handler.
		 */
		onDraggableStart: ( event: DragEvent ) => void;
		/**
		 * `onDragEnd` handler.
		 */
		onDraggableEnd: ( event: DragEvent ) => void;
	} ) => JSX.Element | null;
	/**
	 * Whether to append the cloned element to the `ownerDocument` body.
	 * By default, elements sourced by id are appended to the element's wrapper.
	 *
	 * @default false
	 */
	appendToOwnerDocument?: boolean;
	/**
	 * Classname for the cloned element.
	 */
	cloneClassname?: string;
	/**
	 * The HTML id of the element to clone on drag
	 */
	elementId: string;
	/**
	 * A function called when dragging ends. This callback receives the `event`
	 * object from the `dragend` event as its first parameter.
	 */
	onDragEnd?: ( event: DragEvent ) => void;
	/**
	 * A function called when the element being dragged is dragged over a valid
	 * drop target. This callback receives the `event` object from the
	 * `dragover` event as its first parameter.
	 */
	onDragOver?: ( event: DragEvent ) => void;
	/**
	 * A function called when dragging starts. This callback receives the
	 * `event` object from the `dragstart` event as its first parameter.
	 */
	onDragStart?: ( event: DragEvent ) => void;
	/**
	 * Arbitrary data object attached to the drag and drop event.
	 */
	transferData: unknown;
	/**
	 * The transfer data type to set.
	 *
	 * @default 'text'
	 */
	__experimentalTransferDataType?: string;
	/**
	 * Component to show when dragging.
	 */
	__experimentalDragComponent?: ReactNode;
};
