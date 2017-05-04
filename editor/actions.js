/**
 * External dependencies
 */
import { get } from 'lodash';
import { parse, stringify } from 'querystring';

export function savePost( dispatch, post ) {
	const isNew = ! post.id;
	dispatch( {
		type: 'REQUEST_POST_UPDATE',
		post,
		isNew,
	} );
	new wp.api.models.Post( post ).save().done( ( newPost ) => {
		dispatch( {
			type: 'REQUEST_POST_UPDATE_SUCCESS',
			post: newPost,
			isNew,
		} );
		if ( isNew && window.history.replaceState ) {
			const urlPieces = window.location.href.split( '?' );
			const qs = parse( urlPieces[ 1 ] || '' );
			const newUrl = urlPieces[ 0 ] + '?' + stringify( {
				...qs,
				post_id: newPost.id,
			} );
			window.history.replaceState( {}, 'Post ' + newPost.id, newUrl );
		}
	} ).fail( ( err ) => {
		dispatch( {
			type: 'REQUEST_POST_UPDATE_FAILURE',
			error: get( err, 'responseJSON', {
				code: 'unknown_error',
				message: wp.i18n.__( 'An unknown error occurred.' ),
			} ),
			post,
			isNew,
		} );
	} );
}
