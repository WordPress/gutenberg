/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getActiveFormats } from '../get-active-formats';
import { updateFormats } from '../update-formats';

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

export function useInputAndSelection( props ) {
	const propsRef = useRef( props );
	propsRef.current = props;
	return useRefEffect( ( element ) => {
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;

		let isComposing = false;
		let rafId;

		function onInput( event ) {
			// Do not trigger a change if characters are being composed.
			// Browsers  will usually emit a final `input` event when the
			// characters are composed.
			// As of December 2019, Safari doesn't support
			// nativeEvent.isComposing.
			if ( isComposing ) {
				return;
			}

			let inputType;

			if ( event ) {
				inputType = event.inputType;
			}

			const { record, applyRecord, createRecord, handleChange } =
				propsRef.current;

			// The browser formatted something or tried to insert HTML.
			// Overwrite it. It will be handled later by the format library if
			// needed.
			if (
				inputType &&
				( inputType.indexOf( 'format' ) === 0 ||
					INSERTION_INPUT_TYPES_TO_IGNORE.has( inputType ) )
			) {
				applyRecord( record.current );
				return;
			}

			const currentValue = createRecord();
			const { start, activeFormats: oldActiveFormats = [] } =
				record.current;

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
		 * native events, `keyup`, `mouseup` and `touchend` synthetic events, and
		 * animation frames after the `focus` event.
		 *
		 * @param {Event|DOMHighResTimeStamp} event
		 */
		function handleSelectionChange( event ) {
			const {
				record,
				applyRecord,
				createRecord,
				isSelected,
				onSelectionChange,
			} = propsRef.current;

			// Check if the implementor disabled editing. `contentEditable`
			// does disable input, but not text selection, so we must ignore
			// selection changes.
			if ( element.contentEditable !== 'true' ) {
				return;
			}

			// If the selection changes where the active element is a parent of
			// the rich text instance (writing flow), call `onSelectionChange`
			// for the rich text instance that contains the start or end of the
			// selection.
			if ( ownerDocument.activeElement !== element ) {
				// Only process if the active elment is contentEditable, either
				// this rich text instance or the writing flow parent. Fixes a
				// bug in Firefox where it strangely selects the closest
				// contentEditable element, even though the click was outside
				// any contentEditable element.
				if ( ownerDocument.activeElement.contentEditable !== 'true' ) {
					return;
				}

				if ( ! ownerDocument.activeElement.contains( element ) ) {
					return;
				}

				const selection = defaultView.getSelection();
				const { anchorNode, focusNode } = selection;

				if (
					element.contains( anchorNode ) &&
					element !== anchorNode &&
					element.contains( focusNode ) &&
					element !== focusNode
				) {
					const { start, end } = createRecord();
					record.current.activeFormats = EMPTY_ACTIVE_FORMATS;
					onSelectionChange( start, end );
				} else if (
					element.contains( anchorNode ) &&
					element !== anchorNode
				) {
					const { start, end: offset = start } = createRecord();
					record.current.activeFormats = EMPTY_ACTIVE_FORMATS;
					onSelectionChange( offset );
				} else if ( element.contains( focusNode ) ) {
					const { start, end: offset = start } = createRecord();
					record.current.activeFormats = EMPTY_ACTIVE_FORMATS;
					onSelectionChange( undefined, offset );
				}
				return;
			}

			if ( event.type !== 'selectionchange' && ! isSelected ) {
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
			// during composition, the placeholder doesn't get removed. There's
			// no need to re-add it, when the value is updated on compositionend
			// it will be re-added when the value is empty.
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
				propsRef.current;

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
				onSelectionChange( index, index );
			} else {
				applyRecord( record.current );
				onSelectionChange( record.current.start, record.current.end );
			}

			// Update selection as soon as possible, which is at the next animation
			// frame. The event listener for selection changes may be added too late
			// at this point, but this focus event is still too early to calculate
			// the selection.
			rafId = defaultView.requestAnimationFrame( handleSelectionChange );
		}

		element.addEventListener( 'input', onInput );
		element.addEventListener( 'compositionstart', onCompositionStart );
		element.addEventListener( 'compositionend', onCompositionEnd );
		element.addEventListener( 'focus', onFocus );
		// Selection updates must be done at these events as they
		// happen before the `selectionchange` event. In some cases,
		// the `selectionchange` event may not even fire, for
		// example when the window receives focus again on click.
		element.addEventListener( 'keyup', handleSelectionChange );
		element.addEventListener( 'mouseup', handleSelectionChange );
		element.addEventListener( 'touchend', handleSelectionChange );
		ownerDocument.addEventListener(
			'selectionchange',
			handleSelectionChange
		);
		return () => {
			element.removeEventListener( 'input', onInput );
			element.removeEventListener(
				'compositionstart',
				onCompositionStart
			);
			element.removeEventListener( 'compositionend', onCompositionEnd );
			element.removeEventListener( 'focus', onFocus );
			element.removeEventListener( 'keyup', handleSelectionChange );
			element.removeEventListener( 'mouseup', handleSelectionChange );
			element.removeEventListener( 'touchend', handleSelectionChange );
			ownerDocument.removeEventListener(
				'selectionchange',
				handleSelectionChange
			);
			defaultView.cancelAnimationFrame( rafId );
		};
	}, [] );
}
