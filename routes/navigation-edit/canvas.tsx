/**
 * WordPress dependencies
 */
import { useParams } from '@wordpress/route';

/**
 * Internal dependencies
 */
import NavigationLocationsCanvas from '../navigation/locations-canvas';

function Canvas() {
	const { id } = useParams( { from: '/navigation/edit/$id' } );

	return <NavigationLocationsCanvas navigationId={ Number( id ) } />;
}

export const canvas = Canvas;
