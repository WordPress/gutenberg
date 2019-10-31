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
	const [ isWithinToolbar, setIsWithinToolbar ] = useState( Boolean( context ) );
	const internalRef = useRef();

	const finalRef = ref ? ( ( instance ) => {
		if ( typeof ref === 'function' ) {
			ref( instance );
		} else {
			ref.current = instance;
		}
		internalRef.current = instance;
	} ) : internalRef;

	useEffect( () => {
		if ( isWithinToolbar && internalRef.current ) {
			if ( ! internalRef.current.closest( '[data-toolbar="true"]' ) ) {
				setIsWithinToolbar( false );
			}
		}
	}, [ isWithinToolbar ] );

	return { isWithinToolbar, ref: finalRef };
}

export default useIsWithinToolbar;
