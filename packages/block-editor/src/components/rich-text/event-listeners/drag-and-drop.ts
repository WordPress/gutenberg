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
import { getPasteEventData } from '../../../utils/pasting';
import { unlock } from '../../../lock-unlock';
import { pasteContent } from './paste-handler';

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
	}

	function onDragStart( event: DragEvent ) {
		const { getValue, onChange } = props.current;
		const value = getValue();
		if (
			event.defaultPrevented ||
			isCollapsed( value ) ||
			( ! element.contains( event.target as Node ) &&
				! ownsSelection( element ) )
		) {
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
	}

	const unsubscribeDragStart = subscribeDelegatedListener(
		defaultView,
		'dragstart',
		onDragStart as EventListener
	);
	const unsubscribeDragEnd = subscribeDelegatedListener(
		defaultView,
		'dragend',
		stop
	);
	return () => {
		unsubscribeDragStart();
		unsubscribeDragEnd();
	};
};

/**
 * Inserts text dropped on the field the way the field would on paste. Text
 * dragged from a field is moved.
 *
 * @param props Rich text props.
 */
export const drop = ( props: Props ) => ( element: HTMLElement ) => {
	const { ownerDocument } = element;

	function isTextDrop( { dataTransfer }: DragEvent ) {
		const types = Array.from( dataTransfer!.types );
		return (
			element.isContentEditable &&
			!! ownerDocument.caretPositionFromPoint &&
			! types.includes( 'wp-blocks' ) &&
			! types.includes( 'Files' ) &&
			( types.includes( 'text/plain' ) || types.includes( 'text/html' ) )
		);
	}

	// The block drop zones cancel every drag over them, which hides the
	// browser's drop caret and shows the block insertion point instead.
	function onDragOver( event: DragEvent ) {
		if ( isTextDrop( event ) ) {
			event.stopPropagation();
		}
	}

	function onDrop( event: DragEvent ) {
		if ( event.defaultPrevented || ! isTextDrop( event ) ) {
			return;
		}

		const position = ownerDocument.caretPositionFromPoint(
			event.clientX,
			event.clientY
		);
		if ( ! position || ! element.contains( position.offsetNode ) ) {
			return;
		}
		const range = ownerDocument.createRange();
		range.setStart( position.offsetNode, position.offset );
		let offset = create( {
			element,
			range,
			__unstableIsEditableTree: true,
		} ).start as number;

		const drag = textDrags.get( ownerDocument );
		const isSameField = drag?.element === element;
		if (
			drag &&
			isSameField &&
			offset >= drag.start &&
			offset <= drag.end
		) {
			event.preventDefault();
			drag.stop();
			return;
		}

		const dataTransfer = event.dataTransfer!;
		const data = getPasteEventData( { clipboardData: dataTransfer } );
		if ( ! data || data.files.length ) {
			return;
		}
		const { html = '', plainText = '' } = data;

		const { registry, getValue, onChange } = props.current;
		const { __unstableMarkLastChangeAsPersistent } =
			registry.dispatch( blockEditorStore );
		let isInserted = false;
		// The drop is an undo level of its own, apart from the typing before
		// and after it.
		__unstableMarkLastChangeAsPersistent();
		registry.batch( () => {
			if ( drag ) {
				drag.remove();
				if ( isSameField && offset > drag.end ) {
					offset -= drag.end - drag.start;
				}
			}
			// An insertion into the field of the removal would otherwise not
			// create an undo level.
			__unstableMarkLastChangeAsPersistent();

			// Rich text only applies the new selection to a focused field. A
			// field inside an editing host cannot hold focus.
			const host =
				element.parentElement?.closest< HTMLElement >(
					'[contenteditable]'
				);
			( host?.isContentEditable ? host : element ).focus();

			isInserted = pasteContent(
				{
					...props.current,
					value: { ...getValue(), start: offset, end: offset },
					// Select the dropped content.
					onChange: ( value: RichTextValue ) =>
						onChange( { ...value, start: offset } ),
				},
				{
					html,
					plainText,
					isInternal: dataTransfer.getData( 'rich-text' ) === 'true',
				}
			);
		} );

		if ( isInserted ) {
			event.preventDefault();
			__unstableMarkLastChangeAsPersistent();
		}
	}

	element.addEventListener( 'dragenter', onDragOver );
	element.addEventListener( 'dragover', onDragOver );
	element.addEventListener( 'drop', onDrop );
	return () => {
		element.removeEventListener( 'dragenter', onDragOver );
		element.removeEventListener( 'dragover', onDragOver );
		element.removeEventListener( 'drop', onDrop );
	};
};
