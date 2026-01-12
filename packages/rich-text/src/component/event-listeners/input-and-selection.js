/**
 * Internal dependencies
 */
import { getActiveFormats } from '../../get-active-formats';
import { updateFormats } from '../../update-formats';

/**
 * All inserting input types that would insert HTML into the DOM.
 *
 * @see https://www.w3.org/TR/input-events-2/#interface-InputEvent-Attributes
 *
 * @type {Set}
 */
const INSERTION_INPUT_TYPES_TO_IGNORE = new Set( [
	'insertParagraph',
	'insertOrderedList',
	'insertUnorderedList',
	'insertHorizontalRule',
	'insertLink',
] );

const EMPTY_ACTIVE_FORMATS = [];

const PLACEHOLDER_ATTR_NAME = 'data-rich-text-placeholder';

/**
 * If the selection is set on the placeholder element, collapse the selection to
 * the start (before the placeholder).
 *
 * @param {Window} defaultView
 */
function fixPlaceholderSelection( defaultView ) {
	const selection = defaultView.getSelection();
	const { anchorNode, anchorOffset } = selection;

	if ( anchorNode.nodeType !== anchorNode.ELEMENT_NODE ) {
		return;
	}

	const targetNode = anchorNode.childNodes[ anchorOffset ];

	if (
		! targetNode ||
		targetNode.nodeType !== targetNode.ELEMENT_NODE ||
		! targetNode.hasAttribute( PLACEHOLDER_ATTR_NAME )
	) {
		return;
	}

	selection.collapseToStart();
}

export default ( props ) => ( element ) => {
	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;

	let isComposing = false;

	function onInput( event ) {
		// Do not trigger a change if characters are being composed. Browsers
		// will usually emit a final `input` event when the characters are
		// composed. As of December 2019, Safari doesn't support
		// nativeEvent.isComposing.
		if ( isComposing ) {
			return;
		}

		let inputType;

		if ( event ) {
			inputType = event.inputType;
		}

		const { record, applyRecord, createRecord, handleChange } =
			props.current;

		// The browser formatted something or tried to insert HTML. Overwrite
		// it. It will be handled later by the format library if needed.
		if (
			inputType &&
			( inputType.indexOf( 'format' ) === 0 ||
				INSERTION_INPUT_TYPES_TO_IGNORE.has( inputType ) )
		) {
			applyRecord( record.current );
			return;
		}

		const currentValue = createRecord();
		const { start, activeFormats: oldActiveFormats = [] } = record.current;

		// Update the formats between the last and new caret position.
		const change = updateFormats( {
			value: currentValue,
			start,
			end: currentValue.start,
			formats: oldActiveFormats,
		} );

		handleChange( change );
	}

	/**
	 * Syncs the selection to local state. A callback for the `selectionchange`
	 * event.
	 */
	function handleSelectionChange() {
		const { record, applyRecord, createRecord, onSelectionChange } =
			props.current;

		// Check if the implementor disabled editing. `contentEditable` does
		// disable input, but not text selection, so we must ignore selection
		// changes.
		if ( element.contentEditable !== 'true' ) {
			return;
		}

		// Ensure the active element is the rich text element.
		if ( ownerDocument.activeElement !== element ) {
			// If it is not, we can stop listening for selection changes. We
			// resume listening when the element is focused.
			ownerDocument.removeEventListener(
				'selectionchange',
				handleSelectionChange
			);
			return;
		}

		// In case of a keyboard event, ignore selection changes during
		// composition.
		if ( isComposing ) {
			return;
		}

		const { start, end, text } = createRecord();
		const oldRecord = record.current;

		// Fallback mechanism for IE11, which doesn't support the input event.
		// Any input results in a selection change.
		if ( text !== oldRecord.text ) {
			onInput();
			return;
		}

		if ( start === oldRecord.start && end === oldRecord.end ) {
			// Sometimes the browser may set the selection on the placeholder
			// element, in which case the caret is not visible. We need to set
			// the caret before the placeholder if that's the case.
			if ( oldRecord.text.length === 0 && start === 0 ) {
				fixPlaceholderSelection( defaultView );
			}

			return;
		}

		const newValue = {
			...oldRecord,
			start,
			end,
			// _newActiveFormats may be set on arrow key navigation to control
			// the right boundary position. If undefined, getActiveFormats will
			// give the active formats according to the browser.
			activeFormats: oldRecord._newActiveFormats,
			_newActiveFormats: undefined,
		};

		const newActiveFormats = getActiveFormats(
			newValue,
			EMPTY_ACTIVE_FORMATS
		);

		// Update the value with the new active formats.
		newValue.activeFormats = newActiveFormats;

		// It is important that the internal value is updated first,
		// otherwise the value will be wrong on render!
		record.current = newValue;
		applyRecord( newValue, { domOnly: true } );
		onSelectionChange( start, end );
	}

	function onCompositionStart() {
		isComposing = true;
		// Do not update the selection when characters are being composed as
		// this rerenders the component and might destroy internal browser
		// editing state.
		ownerDocument.removeEventListener(
			'selectionchange',
			handleSelectionChange
		);
		// Remove the placeholder. Since the rich text value doesn't update
		// during composition, the placeholder doesn't get removed. There's no
		// need to re-add it, when the value is updated on compositionend it
		// will be re-added when the value is empty.
		element.querySelector( `[${ PLACEHOLDER_ATTR_NAME }]` )?.remove();
	}

	function onCompositionEnd() {
		isComposing = false;
		// Ensure the value is up-to-date for browsers that don't emit a final
		// input event after composition.
		onInput( { inputType: 'insertText' } );
		// Tracking selection changes can be resumed.
		ownerDocument.addEventListener(
			'selectionchange',
			handleSelectionChange
		);
	}

	function onFocus() {
		const { record, isSelected, onSelectionChange, applyRecord } =
			props.current;

		// When the whole editor is editable, let writing flow handle
		// selection.
		if ( element.parentElement.closest( '[contenteditable="true"]' ) ) {
			return;
		}

		if ( ! isSelected ) {
			// We know for certain that on focus, the old selection is invalid.
			// It will be recalculated on the next mouseup, keyup, or touchend
			// event.
			const index = undefined;

			record.current = {
				...record.current,
				start: index,
				end: index,
				activeFormats: EMPTY_ACTIVE_FORMATS,
			};
		} else {
			applyRecord( record.current, { domOnly: true } );
		}

		onSelectionChange( record.current.start, record.current.end );

		// There is no selection change event when the element is focused, so
		// we need to manually trigger it. The selection is also not available
		// yet in this call stack.
		window.queueMicrotask( handleSelectionChange );

		ownerDocument.addEventListener(
			'selectionchange',
			handleSelectionChange
		);
	}

	element.addEventListener( 'input', onInput );
	element.addEventListener( 'compositionstart', onCompositionStart );
	element.addEventListener( 'compositionend', onCompositionEnd );
	element.addEventListener( 'focus', onFocus );

	return () => {
		element.removeEventListener( 'input', onInput );
		element.removeEventListener( 'compositionstart', onCompositionStart );
		element.removeEventListener( 'compositionend', onCompositionEnd );
		element.removeEventListener( 'focus', onFocus );
	};
};
