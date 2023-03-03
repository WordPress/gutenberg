/**
 * WordPress dependencies
 */
import { useCallback, useSyncExternalStore } from '@wordpress/element';

/** @typedef {import('../register-format-type').RichTextFormatType} RichTextFormatType */
/** @typedef {import('../create').RichTextValue} RichTextValue */

/**
 * Given a range and a format tag name and class name, returns the closest
 * format element.
 *
 * @param {Range}       range                  The Range to check.
 * @param {HTMLElement} editableContentElement The editable wrapper.
 * @param {string}      tagName                The tag name of the format element.
 * @param {string}      className              The class name of the format element.
 *
 * @return {HTMLElement|undefined} The format element, if found.
 */
function getFormatElement( range, editableContentElement, tagName, className ) {
	let element = range.startContainer;

	// If the caret is right before the element, select the next element.
	element = element.nextElementSibling || element;
	element = element.parentElement;

	if ( ! element ) return;
	if ( element === editableContentElement ) return;

	return element.closest( tagName + ( className ? '.' + className : '' ) );
}

/**
 * @typedef {Object} VirtualAnchorElement
 * @property {Function} getBoundingClientRect A function returning a DOMRect
 * @property {Document} ownerDocument         The element's ownerDocument
 */

/**
 * Creates a virtual anchor element for a range.
 *
 * @param {Range}       range                  The range to create a virtual anchor element for.
 * @param {HTMLElement} editableContentElement The editable wrapper.
 *
 * @return {VirtualAnchorElement} The virtual anchor element.
 */
function createVirtualAnchorElement( range, editableContentElement ) {
	return {
		ownerDocument: range.startContainer.ownerDocument,
		getBoundingClientRect() {
			return editableContentElement.contains( range.startContainer )
				? range.getBoundingClientRect()
				: editableContentElement.getBoundingClientRect();
		},
	};
}

const virtualAnchorCache = new WeakMap();

/**
 * This hook, to be used in a format type's Edit component, returns the active
 * element that is formatted, or a virtual element for the selection range if
 * no format is active. The returned value is meant to be used for positioning
 * UI, e.g. by passing it to the `Popover` component via the `anchor` prop.
 *
 * @param {Object}             $1                        Named parameters.
 * @param {HTMLElement|null}   $1.editableContentElement The element containing
 *                                                       the editable content.
 * @param {RichTextFormatType} $1.settings               The format type's settings.
 * @return {Element|VirtualAnchorElement|undefined|null} The active element or selection range.
 */
export function useAnchor( { editableContentElement, settings = {} } ) {
	const { tagName, className } = settings;
	const {
		ownerDocument: { defaultView },
	} = editableContentElement;

	// Let the store be the selection and range, and the anchor be derived data.
	// It's worth noting that the selection reference never changes.
	const selection = defaultView.getSelection();

	// Only re-subscribe when the window changes.
	const subscribe = useCallback(
		( callback ) => {
			defaultView.addEventListener( 'selectionchange', callback );
			return () => {
				defaultView.removeEventListener( 'selectionchange', callback );
			};
		},
		[ defaultView ]
	);

	function getSnapshot() {
		if ( ! editableContentElement ) return;
		if ( ! selection.rangeCount ) return;

		const range = selection.getRangeAt( 0 );

		if ( ! range || ! range.startContainer ) return;

		const formatElement = getFormatElement(
			range,
			editableContentElement,
			tagName,
			className
		);

		if ( formatElement ) return formatElement;

		// Ensure the same reference is returned between re-renderes. This is
		// important for getSnapShot.
		if ( ! virtualAnchorCache.has( range ) ) {
			virtualAnchorCache.set(
				range,
				createVirtualAnchorElement( range, editableContentElement )
			);
		}

		return virtualAnchorCache.get( range );
	}

	return useSyncExternalStore( subscribe, getSnapshot );
}
