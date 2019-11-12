/**
 * WordPress dependencies
 */
import { useContext, useRef, useEffect, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function useIsWithinToolbar( ref ) {
	const context = useContext( ToolbarContext );
	// Initially, it'll be true if there's toolbar context
	const [ isWithinToolbar, setIsWithinToolbar ] = useState( Boolean( context ) );
	const internalRef = useRef();

	// Combine internal ref with ref argument
	const finalRef = ref ? ( ( instance ) => {
		if ( typeof ref === 'function' ) {
			ref( instance );
		} else {
			ref.current = instance;
		}
		internalRef.current = instance;
	} ) : internalRef;

	useEffect( () => {
		// Context propagates through React Portal,
		// so we have to make sure this is really DOM descendant
		if ( isWithinToolbar && internalRef.current ) {
			if ( ! internalRef.current.closest( '[data-toolbar="true"]' ) ) {
				setIsWithinToolbar( false );
			}
		}
	}, [ isWithinToolbar ] );

	return { isWithinToolbar, ref: finalRef };
}

export default useIsWithinToolbar;
