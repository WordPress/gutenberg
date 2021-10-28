/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

function useNavigationAreas() {
	const {
		navigationAreas = [],
		isRequestingAreas = false,
		hasResolvedAreas = false,
	} = useSelect( ( select ) => {
		const { getEntityRecords, isResolving, hasFinishedResolution } = select(
			coreStore
		);
		return {
			navigationAreas: getEntityRecords(
				'taxonomy',
				'wp_navigation_area'
			),
			isRequestingAreas: isResolving( 'getEntityRecords', [
				'taxonomy',
				'wp_navigation_area',
			] ),
			hasResolvedAreas: hasFinishedResolution( 'getEntityRecords', [
				'taxonomy',
				'wp_navigation_area',
			] ),
		};
	}, [] );

	return {
		navigationAreas,
		isRequestingAreas,
		hasResolvedAreas,
	};
}

export default useNavigationAreas;
