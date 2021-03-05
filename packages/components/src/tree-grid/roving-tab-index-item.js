/**
 * WordPress dependencies
 */
import { useRef, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useRovingTabIndexContext } from './roving-tab-index-context';

export default forwardRef( function RovingTabIndexItem(
	{ children, as: Component, ...props },
	forwardedRef
) {
	const localRef = useRef();
	const ref = forwardedRef || localRef;
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
} );
