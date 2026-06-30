/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationTemplateParts from './use-navigation-template-parts';
import {
	buildNavigationLocationsMap,
	getLocationsSummary,
	type NavigationLocation,
	type NavigationLocationsMap,
} from './navigation-locations';

export { getLocationsSummary };
export type { NavigationLocation, NavigationLocationsMap };

export default function useNavigationLocations(): {
	locationsMap: NavigationLocationsMap;
	isResolving: boolean;
} {
	const { partMenuRefs, isResolving } = useNavigationTemplateParts();

	const locationsMap = useMemo( () => {
		return buildNavigationLocationsMap( partMenuRefs );
	}, [ partMenuRefs ] );

	return { locationsMap, isResolving };
}
