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
	const navigationId = Number.parseInt( id.toString(), 10 );

	return <NavigationLocationsCanvas navigationId={ navigationId } />;
}

export const canvas = Canvas;
