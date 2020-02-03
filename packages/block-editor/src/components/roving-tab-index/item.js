/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRovingTabIndexContext } from './context';

export default function RovingTabIndexItem( {
	children,
	as: Component,
	...props
} ) {
	const ref = useRef();
	const {
		lastFocusedElement,
		setLastFocusedElement,
	} = useRovingTabIndexContext();
	let tabIndex;

	if ( lastFocusedElement ) {
		tabIndex = lastFocusedElement === ref.current ? 0 : -1;
	}

	const onFocus = ( event ) => setLastFocusedElement( event.target );
	const allProps = { ref, tabIndex, onFocus, ...props };

	if ( typeof children === 'function' ) {
		return children( allProps );
	}

	return <Component { ...allProps }>{ children }</Component>;
}
