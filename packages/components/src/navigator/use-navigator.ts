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
	const { location, push, pop } = useContext( NavigatorContext );

	return {
		location,
		push,
		pop,
	};
}

export default useNavigator;
