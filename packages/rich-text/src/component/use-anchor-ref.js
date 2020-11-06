/**
 * WordPress dependencies
 */
import { useMemo, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Range, FormatSettings, IsActive } from './format-edit';

export function useAnchorRef() {
	const range = useContext( Range );
	const { tagName, className } = useContext( FormatSettings );
	const isActive = useContext( IsActive );

	return useMemo( () => {
		if ( ! isActive ) {
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
	}, [ isActive, range, tagName, className ] );
}
