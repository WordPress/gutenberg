/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useSearch } from '@wordpress/route';

/**
 * Internal dependencies
 */
import NavigationLocationsCanvas from '../navigation/locations-canvas';

const NAVIGATION_POST_TYPE = 'wp_navigation';

const NAVIGATION_MENUS_QUERY = {
	per_page: 100,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

type NavigationRecord = {
	id: number;
};

function Canvas() {
	const searchParams = useSearch( { from: '/navigation/list' } );
	const { records: navigationMenus } = useEntityRecords(
		'postType',
		NAVIGATION_POST_TYPE,
		NAVIGATION_MENUS_QUERY
	);
	const selectedId = searchParams.ids?.[ 0 ]
		? Number( searchParams.ids[ 0 ] )
		: ( navigationMenus as NavigationRecord[] | undefined )?.[ 0 ]?.id;

	return <NavigationLocationsCanvas navigationId={ selectedId } />;
}

export const canvas = Canvas;
