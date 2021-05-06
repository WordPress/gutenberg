/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const fetchMenuCustomItems = async ( search, { type } ) => {
	const path = addQueryArgs( '/__experimental/menu-custom-items', { type } );
	return apiFetch( {
		path,
	} ).then( ( results ) => {
		return results.filter(
			( result ) =>
				search === '' || result.title.match( new RegExp( search, 'i' ) )
		);
	} );
};

export default fetchMenuCustomItems;
