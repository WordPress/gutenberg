/**
 * WordPress dependencies
 */
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

	return {
		push( path, options ) {
			setIsAnimating( true );
			setLocation( { path, ...options } );
		},
	};
}

export default useNavigator;
