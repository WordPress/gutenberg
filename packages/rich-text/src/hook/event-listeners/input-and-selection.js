/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getActiveFormats } from '../../get-active-formats';
import { isCollapsed } from '../../is-collapsed';
import { updateFormats } from '../../update-formats';
import { unlock } from '../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

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

		// When a non-collapsed selection is deleted (not replaced with new
		// text), the old active formats refer to the deleted content and
		// should not be carried forward.
		const clearFormats =
			! isCollapsed( record.current ) && currentValue.start <= start;

		// Update the formats between the last and new caret position.
		const change = updateFormats( {
			value: currentValue,
			start,
			end: currentValue.start,
			formats: clearFormats ? [] : oldActiveFormats,
		} );

		handleChange( change );
	}

	let selectionSnapshot;

	/**
	 * Syncs the selection to local state. A callback for the `selectionchange`
	 * event, and for the capture phase of events that consume the selection,
	 * which run before `selectionchange` is delivered.
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

		// Ensure the active element is the rich text element. The listener
		// stays subscribed but no-ops for instances that aren't focused.
		if ( ownerDocument.activeElement !== element ) {
			return;
		}

		// In case of a keyboard event, ignore selection changes during
		// composition.
		if ( isComposing ) {
			return;
		}

		const selection = defaultView.getSelection();

		// Skip selections that have already been processed into the current
		// record, such as the `selectionchange` event for a selection that
		// was synchronized on capture of a consuming event, or coalesced
		// duplicates. The offsets the processing produced are compared to
		// the record too: the record's selection may be rewritten from
		// (possibly stale) props on render without the DOM selection moving,
		// in which case the selection must be processed again.
		if (
			selectionSnapshot &&
			selectionSnapshot.anchorNode === selection.anchorNode &&
			selectionSnapshot.anchorOffset === selection.anchorOffset &&
			selectionSnapshot.focusNode === selection.focusNode &&
			selectionSnapshot.focusOffset === selection.focusOffset &&
			selectionSnapshot.processedStart === record.current.start &&
			selectionSnapshot.processedEnd === record.current.end
		) {
			return;
		}

		const { start, end, text } = createRecord();
		const oldRecord = record.current;

		selectionSnapshot = {
			anchorNode: selection.anchorNode,
			anchorOffset: selection.anchorOffset,
			focusNode: selection.focusNode,
			focusOffset: selection.focusOffset,
			processedStart: start,
			processedEnd: end,
		};

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
		// `handleSelectionChange` returns early while composing, so the
		// selection is not updated as characters are composed (which rerenders
		// the component and might destroy internal browser editing state).
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
	}

	function onFocus( event ) {
		// `focusin` bubbles from focusable descendants too — only act
		// when focus lands on the editable itself.
		if ( event.target !== element ) {
			return;
		}

		// `contentEditable` can be false even on a tabindex'd element
		// (e.g. a paragraph with a locked block binding). When that's the
		// case the rich text isn't actually being edited and shouldn't
		// claim selection — block-editor's `use-focus-handler.js` will
		// dispatch `selectionChange(clientId)` to keep `attributeKey`
		// unset for the wrapper-level focus.
		if ( element.contentEditable !== 'true' ) {
			return;
		}

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
			// The record no longer reflects the selection, so a matching
			// snapshot must not skip synchronization.
			selectionSnapshot = undefined;
		} else {
			applyRecord( record.current, { domOnly: true } );
		}

		onSelectionChange( record.current.start, record.current.end );

		// There is no selection change event when the element is focused, so
		// we need to manually trigger it. The selection is also not available
		// yet in this call stack.
		window.queueMicrotask( handleSelectionChange );
	}

	// `input` and `compositionend` must run before block-editor's
	// `input-rules.js` element-level listeners, which call `getValue()`
	// reading `record.current` updated by our `onInput`. Use capture phase
	// so we fire before any ancestor bubble handlers.
	const unsubscribeInput = subscribeDelegatedListener(
		element,
		'input',
		onInput,
		true
	);
	const unsubscribeCompositionStart = subscribeDelegatedListener(
		element,
		'compositionstart',
		onCompositionStart
	);
	const unsubscribeCompositionEnd = subscribeDelegatedListener(
		element,
		'compositionend',
		onCompositionEnd,
		true
	);
	const unsubscribeFocus = subscribeDelegatedListener(
		element,
		'focusin',
		onFocus
	);
	// Permanently subscribed rather than added on focus and removed on blur:
	// `handleSelectionChange` checks whether the element is focused itself,
	// and the shared underlying delegated listener keeps the number of native
	// listeners constant.
	const unsubscribeSelectionChange = subscribeDelegatedListener(
		ownerDocument,
		'selectionchange',
		handleSelectionChange
	);
	// The native `selectionchange` event is asynchronous and coalesced: the
	// record and the store selection can be one selection behind the DOM when
	// an event that acts on them arrives, regardless of how the selection got
	// there. Synchronize on capture of the events that consume the record,
	// the store selection, or a value rendered from them, before any other
	// handler runs. The snapshot comparison in `handleSelectionChange` skips
	// selections that have already been processed.
	const unsubscribeEnsureSelectionSync = [
		'keydown',
		'beforeinput',
		'copy',
		'cut',
		'paste',
	].map( ( eventType ) =>
		subscribeDelegatedListener(
			ownerDocument,
			eventType,
			handleSelectionChange,
			true
		)
	);

	return () => {
		unsubscribeInput();
		unsubscribeCompositionStart();
		unsubscribeCompositionEnd();
		unsubscribeFocus();
		unsubscribeSelectionChange();
		unsubscribeEnsureSelectionSync.forEach( ( unsubscribe ) =>
			unsubscribe()
		);
	};
};
