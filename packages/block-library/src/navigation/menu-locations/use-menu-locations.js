import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { PRELOADED_NAVIGATION_MENUS_QUERY } from '../constants';
import {
	getFallbackMenuId,
	getNavigationLocations,
	NAVIGATION_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_PARTS_QUERY,
} from './utils';

const EMPTY_ARRAY = [];

/**
 * Every template part with a Navigation block in it, with unsaved edits, and
 * the site's menus.
 *
 * @return {Object} `{ locations, menus, isResolving }`.
 */
export function useNavigationLocations() {
	const templateParts = useSelect( ( select ) => {
		const { getEntityRecords, getEditedEntityRecord } = select( coreStore );
		const records = getEntityRecords(
			'postType',
			TEMPLATE_PART_POST_TYPE,
			TEMPLATE_PARTS_QUERY
		);

		// Each edited record is memoized by core-data, and an array is
		// compared item by item, so this only re-renders on a real change.
		return records
			? records.map( ( record ) =>
					getEditedEntityRecord(
						'postType',
						TEMPLATE_PART_POST_TYPE,
						record.id
					)
				)
			: null;
	}, [] );

	const { menus, isResolving } = useSelect( ( select ) => {
		const { getEntityRecords, hasFinishedResolution } = select( coreStore );

		return {
			menus:
				getEntityRecords(
					'postType',
					NAVIGATION_POST_TYPE,
					PRELOADED_NAVIGATION_MENUS_QUERY
				) || EMPTY_ARRAY,
			isResolving: ! hasFinishedResolution( 'getEntityRecords', [
				'postType',
				TEMPLATE_PART_POST_TYPE,
				TEMPLATE_PARTS_QUERY,
			] ),
		};
	}, [] );

	const fallbackMenuId = getFallbackMenuId( menus );
	const locations = useMemo(
		() =>
			getNavigationLocations(
				templateParts || EMPTY_ARRAY,
				fallbackMenuId
			),
		[ templateParts, fallbackMenuId ]
	);

	return { locations, menus, isResolving };
}

/**
 * Where a menu is shown, and where else it could be.
 *
 * @param {number} navigationId The menu's ID.
 * @return {Object} `{ locations, otherLocations, menus, isResolving }`.
 */
export function useMenuLocations( navigationId ) {
	const {
		locations: allLocations,
		menus,
		isResolving,
	} = useNavigationLocations();

	return useMemo( () => {
		const id = Number( navigationId );

		return {
			locations: allLocations.filter( ( location ) =>
				location.menuIds.includes( id )
			),
			otherLocations: allLocations.filter(
				( location ) => ! location.menuIds.includes( id )
			),
			menus,
			isResolving,
		};
	}, [ allLocations, menus, isResolving, navigationId ] );
}
