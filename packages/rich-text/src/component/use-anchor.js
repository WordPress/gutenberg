/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useState, useLayoutEffect } from '@wordpress/element';

/** @typedef {import('../register-format-type').WPFormat} WPFormat */
/** @typedef {import('../types').RichTextValue} RichTextValue */

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

	// Even if the active format is defined, the actually DOM range's start
	// container may be outside of the format's DOM element:
	// `a‸<strong>b</strong>` (DOM) while visually it's `a<strong>‸b</strong>`.
	// So at a given selection index, start with the deepest format DOM element.
	if (
		element.nodeType === element.TEXT_NODE &&
		range.startOffset === element.length &&
		element.nextSibling
	) {
		element = element.nextSibling;

		while ( element.firstChild ) {
			element = element.firstChild;
		}
	}

	if ( element.nodeType !== element.ELEMENT_NODE ) {
		element = element.parentElement;
	}

	if ( ! element ) {
		return;
	}
	if ( element === editableContentElement ) {
		return;
	}
	if ( ! editableContentElement.contains( element ) ) {
		return;
	}

	const selector = tagName + ( className ? '.' + className : '' );

	// .closest( selector ), but with a boundary. Check if the element matches
	// the selector. If it doesn't match, try the parent element if it's not the
	// editable wrapper. We don't want to try to match ancestors of the editable
	// wrapper, which is what .closest( selector ) would do. When the element is
	// the editable wrapper (which is most likely the case because most text is
	// unformatted), this never runs.
	while ( element !== editableContentElement ) {
		if ( element.matches( selector ) ) {
			return element;
		}

		element = element.parentElement;
	}
}

/**
 * @typedef {Object} VirtualAnchorElement
 * @property {() => DOMRect} getBoundingClientRect A function returning a DOMRect
 * @property {HTMLElement}   contextElement        The actual DOM element
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
		contextElement: editableContentElement,
		getBoundingClientRect() {
			return editableContentElement.contains( range.startContainer )
				? range.getBoundingClientRect()
				: editableContentElement.getBoundingClientRect();
		},
	};
}

/**
 * Get the anchor: a format element if there is a matching one based on the
 * tagName and className or a range otherwise.
 *
 * @param {HTMLElement} editableContentElement The editable wrapper.
 * @param {string}      tagName                The tag name of the format
 *                                             element.
 * @param {string}      className              The class name of the format
 *                                             element.
 *
 * @return {HTMLElement|VirtualAnchorElement|undefined} The anchor.
 */
function getAnchor( editableContentElement, tagName, className ) {
	if ( ! editableContentElement ) {
		return;
	}

	const { ownerDocument } = editableContentElement;
	const { defaultView } = ownerDocument;
	const selection = defaultView.getSelection();

	if ( ! selection ) {
		return;
	}
	if ( ! selection.rangeCount ) {
		return;
	}

	const range = selection.getRangeAt( 0 );

	if ( ! range || ! range.startContainer ) {
		return;
	}

	const formatElement = getFormatElement(
		range,
		editableContentElement,
		tagName,
		className
	);

	if ( formatElement ) {
		return formatElement;
	}

	return createVirtualAnchorElement( range, editableContentElement );
}

/**
 * This hook, to be used in a format type's Edit component, returns the active
 * element that is formatted, or a virtual element for the selection range if
 * no format is active. The returned value is meant to be used for positioning
 * UI, e.g. by passing it to the `Popover` component via the `anchor` prop.
 *
 * @param {Object}           $1                        Named parameters.
 * @param {HTMLElement|null} $1.editableContentElement The element containing
 *                                                     the editable content.
 * @param {WPFormat=}        $1.settings               The format type's settings.
 * @return {Element|VirtualAnchorElement|undefined|null} The active element or selection range.
 */
export function useAnchor( { editableContentElement, settings = {} } ) {
	const { tagName, className, isActive } = settings;
	const [ anchor, setAnchor ] = useState( () =>
		getAnchor( editableContentElement, tagName, className )
	);
	const wasActive = usePrevious( isActive );

	useLayoutEffect( () => {
		if ( ! editableContentElement ) {
			return;
		}

		function callback() {
			setAnchor(
				getAnchor( editableContentElement, tagName, className )
			);
		}

		function attach() {
			ownerDocument.addEventListener( 'selectionchange', callback );
		}

		function detach() {
			ownerDocument.removeEventListener( 'selectionchange', callback );
		}

		const { ownerDocument } = editableContentElement;

		if (
			editableContentElement === ownerDocument.activeElement ||
			// When a link is created, we need to attach the popover to the newly created anchor.
			( ! wasActive && isActive ) ||
			// Sometimes we're _removing_ an active anchor, such as the inline color popover.
			// When we add the color, it switches from a virtual anchor to a `<mark>` element.
			// When we _remove_ the color, it switches from a `<mark>` element to a virtual anchor.
			( wasActive && ! isActive )
		) {
			setAnchor(
				getAnchor( editableContentElement, tagName, className )
			);
			attach();
		}

		editableContentElement.addEventListener( 'focusin', attach );
		editableContentElement.addEventListener( 'focusout', detach );

		return () => {
			detach();

			editableContentElement.removeEventListener( 'focusin', attach );
			editableContentElement.removeEventListener( 'focusout', detach );
		};
	}, [ editableContentElement, tagName, className, isActive, wasActive ] );

	return anchor;
}
