import { useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import type { RefObject } from 'react';
import { getActiveFormat } from '../get-active-format';
import type { FormatType, RichTextValue } from '../types';

/**
 * This hook, to be used in a format type's Edit component, returns the active
 * element that is formatted, or the selection range if no format is active.
 * The returned value is meant to be used for positioning UI, e.g. by passing it
 * to the `Popover` component.
 *
 * @param {Object}                 options          Named parameters.
 * @param {RefObject<HTMLElement>} options.ref      React ref of the element
 *                                                  containing  the editable content.
 * @param {RichTextValue}          options.value    Value to check for selection.
 * @param {FormatType}             options.settings The format type's settings.
 *
 * @return {Element|Range} The active element or selection range.
 */
export function useAnchorRef( {
	ref,
	value,
	settings = {},
}: {
	ref: RefObject< HTMLElement | null >;
	value: RichTextValue;
	settings?: Partial< FormatType >;
} ) {
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
		const selection = defaultView!.getSelection()!;

		if ( ! selection.rangeCount ) {
			return;
		}

		const range = selection.getRangeAt( 0 );

		if ( ! activeFormat ) {
			return range;
		}

		let element: Node = range.startContainer;

		// If the caret is right before the element, select the next element.
		element = ( element as Element ).nextElementSibling || element;

		while ( element.nodeType !== element.ELEMENT_NODE ) {
			element = element.parentNode!;
		}

		return ( element as Element ).closest(
			tagName + ( className ? '.' + className : '' )
		);
	}, [ activeFormat, value.start, value.end, tagName, className ] );
}
