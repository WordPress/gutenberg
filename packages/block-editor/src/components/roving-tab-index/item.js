/**
 * WordPress dependencies
 */
import { useRef, Children, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRovingTabIndexContext } from './context';

export default function RovingTabIndexItem( { children } ) {
	const ref = useRef();
	const lastFocusedElement = useRovingTabIndexContext();
	let tabIndex;

	if ( lastFocusedElement ) {
		tabIndex = lastFocusedElement === ref.current ? 0 : -1;
	}

	// Ensure a single child.
	Children.only( children );

	// Override the tabIndex and ref props to the child element.
	return cloneElement( children, {
		tabIndex,
		ref,
	} );
}
