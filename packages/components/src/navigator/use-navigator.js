/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NavigatorContext } from './context';

function useNavigator() {
	const [ , setPath ] = useContext( NavigatorContext );

	return {
		push( path, options ) {
			setPath( { path, ...options } );
		},
	};
}

export default useNavigator;
