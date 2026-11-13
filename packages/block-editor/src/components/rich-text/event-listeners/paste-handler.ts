import { pasteHandler } from '@wordpress/blocks';
import {
	isEmpty,
	insert,
	create,
	getActiveFormats,
} from '@wordpress/rich-text';
import { isURL } from '@wordpress/url';
import { store as blockEditorStore } from '../../../store';
import { addActiveFormats } from '../utils';
import { getPasteEventData } from '../../../utils/pasting';
import { getDropPasteProps, isTextDrop } from './drag-and-drop';
import type { RichTextField } from '../types';

/**
 * Pastes in the field, which also inserts text dropped on it.
 *
 * @param field Rich text field.
 * @param event Paste or drop event.
 */
export function onPaste(
	field: RichTextField,
	event: ClipboardEvent | DragEvent
) {
	const { element, props } = field;
	// A drop pastes at the drop point.
	const pasteProps =
		event.type === 'drop'
			? getDropPasteProps( props.current, element, event as DragEvent )
			: props.current;

	if ( ! pasteProps ) {
		return;
	}

	const {
		disableFormats,
		onChange,
		value,
		formatTypes,
		tagName,
		onReplace,
		__unstableEmbedURLOnPaste,
		preserveWhiteSpace,
		pastePlainText,
		registry,
	} = pasteProps;

	if ( event.defaultPrevented ) {
		return;
	}

	// A drop carries its data in `dataTransfer`.
	const { clipboardData = ( event as DragEvent ).dataTransfer } =
		event as ClipboardEvent;
	// Missing clipboard data throws inside, which returns undefined.
	const pasteData = getPasteEventData( {
		clipboardData: clipboardData as DataTransfer,
	} );

	// Some browsers don't support `clipboardData` and paste plain text on
	// their own, so the event has to be left alone for them.
	if ( ! pasteData ) {
		return;
	}

	event.preventDefault();

	// The text is only missing with files, which return below.
	const { plainText, html, files } = pasteData as {
		plainText: string;
		html: string;
		files: File[];
	};

	// Rich text can only paste text; files are placed by the writing flow.
	if ( files.length ) {
		return;
	}

	// Allows us to ask for this information when we get a report.
	// `pasteHandler` also logs this, but we're not using `pasteHandler` in
	// every case.
	window.console.log( 'Received HTML (RichText):\n\n', html );
	window.console.log( 'Received plain text (RichText):\n\n', plainText );

	if ( disableFormats ) {
		onChange( insert( value, plainText ) );
		return;
	}

	// Pasting without clipboard data returned above.
	const isInternal = clipboardData!.getData( 'rich-text' ) === 'true';

	function pasteInline( content: string ) {
		const transformed = formatTypes.reduce(
			( accumulator, { __unstablePasteRule } ) => {
				// Only allow one transform.
				if ( __unstablePasteRule && accumulator === value ) {
					accumulator = __unstablePasteRule( value, {
						html,
						plainText,
					} );
				}

				return accumulator;
			},
			value
		);
		if ( transformed !== value ) {
			onChange( transformed );
		} else {
			const valueToInsert = create( { html: content } );
			addActiveFormats( valueToInsert, getActiveFormats( value ) );
			onChange( insert( value, valueToInsert ) );
		}
	}

	// If the data comes from a rich text instance, we can directly use it
	// without filtering the data. The filters are only meant for externally
	// pasted content and remove inline styles.
	if ( isInternal ) {
		pasteInline( html );
		return;
	}

	if ( pastePlainText ) {
		const valueToInsert = create( { text: plainText } );
		addActiveFormats( valueToInsert, getActiveFormats( value ) );
		onChange( insert( value, valueToInsert ) );
		return;
	}

	let mode: 'INLINE' | 'BLOCKS' = 'INLINE';

	const trimmedPlainText = plainText.trim();

	if (
		__unstableEmbedURLOnPaste &&
		isEmpty( value ) &&
		isURL( trimmedPlainText ) &&
		// For the link pasting feature, allow only http(s) protocols.
		/^https?:/.test( trimmedPlainText )
	) {
		mode = 'BLOCKS';
	}

	const content = pasteHandler( {
		HTML: html,
		plainText,
		mode,
		// Fields render HTML tags.
		tagName: tagName as string,
		// @ts-expect-error The paste handler ignores `preserveWhiteSpace`.
		preserveWhiteSpace,
	} );

	if ( typeof content === 'string' ) {
		pasteInline( content );
		return;
	}

	if ( ! content.length || ! onReplace || ! isEmpty( value ) ) {
		return;
	}

	// Record an intermediate paragraph-with-URL state so a single undo
	// after the URL → block transformation restores the pasted link.
	if ( mode === 'BLOCKS' ) {
		pasteInline( html );
		registry
			.dispatch( blockEditorStore )
			.__unstableMarkLastChangeAsPersistent();
	}

	onReplace( content, content.length - 1, -1 );
}

// The block drop zones cancel every drag over them, which hides the
// browser's drop caret and shows the block insertion point instead. An
// empty field keeps the drop zone, which shows the block is replaced.
export function onDragOver(
	{ element, props }: RichTextField,
	event: DragEvent
) {
	if (
		element.isContentEditable &&
		! isEmpty( props.current.getValue() ) &&
		// Drag events carry a data transfer.
		isTextDrop( element.ownerDocument, event.dataTransfer! )
	) {
		event.stopPropagation();
	}
}

/**
 * Inserts text dropped on the field the way the field would on paste, as one
 * undo level.
 *
 * @param field Rich text field.
 * @param event Drop event.
 */
export function onDrop( field: RichTextField, event: DragEvent ) {
	field.props.current.registry.batch( () => onPaste( field, event ) );
}
