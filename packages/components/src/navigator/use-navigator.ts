/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NavigatorContext } from './context';
import type { Navigator } from './types';

/**
 * Retrieves a `navigator` instance.
 */
function useNavigator(): Navigator {
	const { setLocation, setIsAnimating } = useContext( NavigatorContext );
	const prefersReducedMotion = useReducedMotion();

	return {
		push( path, options ) {
			if ( ! prefersReducedMotion ) {
				setIsAnimating( true );
			}
			setLocation( { path, ...options } );
		},
	};
}

export default useNavigator;
