/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useEffect, useState } from '@wordpress/element';

export default function usePostTerms( { postId, postType, term } ) {
	const { rest_base: restBase } = term;
	const [ termIds ] = useEntityProp( 'postType', postType, restBase, postId );
	const [ result, setResult ] = useState( {} );
	useEffect( () => {
		if ( ! termIds ) {
			// Waiting for post terms to be fetched.
			setResult( { isLoading: true } );
			return;
		}
		if ( ! termIds.length ) {
			setResult( { isLoading: false } );
			return;
		}
		const query = {
			per_page: -1,
			orderby: 'name',
			order: 'asc',
			include: termIds,
			_fields: 'id,name,link',
		};
		apiFetch( {
			path: addQueryArgs( `/wp/v2/${ restBase }`, query ),
		} )
			.then( ( terms ) => {
				setResult( {
					postTerms: terms,
					isLoading: false,
					hasPostTerms: !! terms?.length,
				} );
			} )
			.catch( () => {
				setResult( { isLoading: false } );
			} );
	}, [ termIds ] );
	return result;
}
