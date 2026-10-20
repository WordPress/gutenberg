import {
	create,
	getTextContent,
	isCollapsed,
	remove,
	slice,
	toHTMLString,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { privateApis as composePrivateApis } from '@wordpress/compose';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );
const { ownsSelection } = unlock( richTextPrivateApis );

type RichTextValue = ReturnType< typeof create >;

interface Props {
	current: {
		getValue: () => RichTextValue;
		onChange: ( value: RichTextValue ) => void;
		registry: {
			batch: ( callback: () => void ) => void;
			dispatch: ( store: typeof blockEditorStore ) => {
				__unstableMarkLastChangeAsPersistent: () => void;
			};
		};
		[ key: string ]: unknown;
	};
}

interface TextDrag {
	element: HTMLElement;
	start: number;
	end: number;
	remove: () => void;
	stop: () => void;
}

/**
 * The text drag started in a document, so the field it is dropped on can
 * remove the text from where it was.
 */
const textDrags = new WeakMap< Document, TextDrag >();

function stopPropagation( event: Event ) {
	event.stopPropagation();
}

export function isTextDrop(
	ownerDocument: Document,
	dataTransfer: DataTransfer
) {
	const types = Array.from( dataTransfer.types );
	return (
		!! ownerDocument.caretPositionFromPoint &&
		! types.includes( 'wp-blocks' ) &&
		! types.includes( 'Files' ) &&
		( types.includes( 'text/plain' ) || types.includes( 'text/html' ) )
	);
}

/**
 * Returns the field a text drop lands in, the offset in it, the range there,
 * and whether it lands on the dragged text.
 *
 * @param event Drop event.
 */
export function getTextDropPoint( event: DragEvent ) {
	const { ownerDocument } = event.target as Node;
	if (
		! ownerDocument ||
		! isTextDrop( ownerDocument, event.dataTransfer! )
	) {
		return;
	}
	const position = ownerDocument.caretPositionFromPoint(
		event.clientX,
		event.clientY
	);
	if ( ! position ) {
		return;
	}
	const { offsetNode } = position;
	const element = (
		offsetNode.nodeType === offsetNode.ELEMENT_NODE
			? ( offsetNode as Element )
			: offsetNode.parentElement
	)?.closest< HTMLElement >( '[data-wp-block-attribute-key]' );
	if ( ! element?.isContentEditable ) {
		return;
	}
	const range = ownerDocument.createRange();
	range.setStart( offsetNode, position.offset );
	const offset = create( {
		element,
		range,
		__unstableIsEditableTree: true,
	} ).start as number;
	const drag = textDrags.get( ownerDocument );
	const isOnDraggedText =
		drag?.element === element && offset >= drag.start && offset <= drag.end;
	return { element, offset, range, isOnDraggedText };
}

/**
 * Starts a drag of the text selected in the field.
 *
 * @param props Rich text props.
 */
export const dragStart = ( props: Props ) => ( element: HTMLElement ) => {
	const { ownerDocument } = element;
	const defaultView = ownerDocument.defaultView!;

	function stop() {
		textDrags.delete( ownerDocument );
		defaultView.removeEventListener( 'dragenter', stopPropagation, true );
		defaultView.removeEventListener( 'dragover', stopPropagation, true );
		defaultView.removeEventListener( 'dragend', stop );
		defaultView.removeEventListener( 'drop', stop );
	}

	function onDragStart( event: DragEvent ) {
		const { getValue, onChange } = props.current;
		const value = getValue();
		const target = event.target as Node;
		// The drag starts on the selected text, or on the editing host
		// around the field when the host owns the selection.
		const isSource =
			element.contains( target ) ||
			( target.contains( element ) && ownsSelection( element ) );
		if ( event.defaultPrevented || isCollapsed( value ) || ! isSource ) {
			return;
		}

		// Safari before 26.2 cannot locate the drop position.
		if (
			! ownerDocument.caretPositionFromPoint ||
			! element.isContentEditable
		) {
			event.preventDefault();
			return;
		}

		const { start, end } = value as { start: number; end: number };
		const dragged = slice( value );
		const dataTransfer = event.dataTransfer!;
		dataTransfer.effectAllowed = 'move';
		dataTransfer.clearData();
		dataTransfer.setData( 'text/plain', getTextContent( dragged ) );
		dataTransfer.setData( 'text/html', toHTMLString( { value: dragged } ) );
		dataTransfer.setData( 'rich-text', 'true' );
		textDrags.set( ownerDocument, {
			element,
			start,
			end,
			remove() {
				stop();
				onChange( remove( getValue(), start, end ) );
			},
			stop,
		} );

		// The block drop zones cancel every drag over them, which hides the
		// browser's drop caret and shows the block insertion point instead.
		defaultView.addEventListener( 'dragenter', stopPropagation, true );
		defaultView.addEventListener( 'dragover', stopPropagation, true );
		// Not tied to the source field, which may no longer be selected when
		// the drag ends. A drop in this window also ends it, since Firefox
		// skips `dragend` when the source node is removed.
		defaultView.addEventListener( 'dragend', stop );
		defaultView.addEventListener( 'drop', stop );
	}

	// Before the block's own drag start handler, which cancels the drags it
	// does not carry.
	return subscribeDelegatedListener(
		defaultView,
		'dragstart',
		onDragStart as EventListener,
		true
	);
};

/**
 * Returns the props a text drop on the field pastes with: the value with the
 * selection at the drop point, and a change handler that selects the dropped
 * content. Text dragged from a field is removed from there first.
 *
 * @param props   Rich text props.
 * @param element The field.
 * @param event   Drop event.
 */
export function getDropPasteProps(
	props: Props[ 'current' ],
	element: HTMLElement,
	event: DragEvent
) {
	if ( event.defaultPrevented ) {
		return;
	}
	const point = getTextDropPoint( event );
	if ( point?.element !== element ) {
		return;
	}
	const drag = textDrags.get( element.ownerDocument );
	if ( point.isOnDraggedText ) {
		event.preventDefault();
		drag?.stop();
		return;
	}

	let { offset } = point;
	const isSameField = drag?.element === element;
	const { registry, getValue, onChange } = props;
	const { __unstableMarkLastChangeAsPersistent } =
		registry.dispatch( blockEditorStore );
	// The drop is an undo level of its own, apart from the typing before and
	// after it.
	__unstableMarkLastChangeAsPersistent();
	if ( drag ) {
		drag.remove();
		if ( isSameField && offset > drag.end ) {
			offset -= drag.end - drag.start;
		}
	}

	return {
		...props,
		value: { ...getValue(), start: offset, end: offset },
		// Select the dropped content.
		onChange: ( value: RichTextValue ) => {
			onChange( { ...value, start: offset } );
			__unstableMarkLastChangeAsPersistent();
		},
	};
}
