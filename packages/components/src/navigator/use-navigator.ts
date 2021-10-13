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
	const [ , setPath ] = useContext( NavigatorContext );

	return {
		push( path, options ) {
			setPath( { path, ...options } );
		},
	};
}

export default useNavigator;
