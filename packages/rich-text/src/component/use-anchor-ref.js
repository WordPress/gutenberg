/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { getActiveFormat } from '../get-active-format';

/**
 * @template T
 * @typedef {import('@wordpress/element').RefObject<T>} RefObject<T>
 */
/** @typedef {import('../register-format-type').WPFormat} WPFormat */
/** @typedef {import('../types').RichTextValue} RichTextValue */

/**
 * This hook, to be used in a format type's Edit component, returns the active
 * element that is formatted, or the selection range if no format is active.
 * The returned value is meant to be used for positioning UI, e.g. by passing it
 * to the `Popover` component.
 *
 * @param {Object}                 $1          Named parameters.
 * @param {RefObject<HTMLElement>} $1.ref      React ref of the element
 *                                             containing  the editable content.
 * @param {RichTextValue}          $1.value    Value to check for selection.
 * @param {WPFormat}               $1.settings The format type's settings.
 *
 * @return {Element|Range} The active element or selection range.
 */
export function useAnchorRef( { ref, value, settings = {} } ) {
	deprecated( '`useAnchorRef` hook', {
		since: '6.1',
		alternative: '`useAnchor` hook',
	} );

	const { tagName, className, name } = settings;
	const activeFormat = name ? getActiveFormat( value, name ) : undefined;

	return useMemo( () => {
		if ( ! ref.current ) {
			return;
		}
		const {
			ownerDocument: { defaultView },
		} = ref.current;
		const selection = defaultView.getSelection();

		if ( ! selection.rangeCount ) {
			return;
		}

		const range = selection.getRangeAt( 0 );

		if ( ! activeFormat ) {
			return range;
		}

		let element = range.startContainer;

		// If the caret is right before the element, select the next element.
		element = element.nextElementSibling || element;

		while ( element.nodeType !== element.ELEMENT_NODE ) {
			element = element.parentNode;
		}

		return element.closest(
			tagName + ( className ? '.' + className : '' )
		);
	}, [ activeFormat, value.start, value.end, tagName, className ] );
}
