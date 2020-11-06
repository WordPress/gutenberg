/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Ref, FormatSettings, Value } from './format-edit';
import { getActiveFormat } from '../get-active-format';

/**
 * This hook, to be used in a format type's Edit component, returns the active
 * element that is formatted, or the selection range if no format is active.
 * The returned value is meant to be used for positioning UI, e.g. by passing it
 * to the `Popover` component.
 *
 * @return {Element|Range} The active element or selection range.
 */
export function useAnchorRef() {
	const ref = useContext( Ref );
	const { tagName, className, name } = useContext( FormatSettings );
	const value = useContext( Value );
	const activeFormat = getActiveFormat( value, name );

	return useMemo( () => {
		const { ownerDocument } = ref.current;
		const { defaultView } = ownerDocument;
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
