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
 * Retrieves a `navigator` instance. This hook provides advanced functionality,
 * such as imperatively navigating to a new location (with options like
 * navigating back or skipping focus restoration) and accessing the current
 * location and path parameters.
 */
export function useNavigator(): Navigator {
	const { location, params, goTo, goBack, goToParent } =
		useContext( NavigatorContext );

	return {
		location,
		goTo,
		goBack,
		goToParent,
		params,
	};
}
