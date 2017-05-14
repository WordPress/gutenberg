/**
 * External dependencies
 */
import { get } from 'lodash';
import { parse, stringify } from 'querystring';

export function savePost( dispatch, postId, edits ) {
	const toSend = postId ? { id: postId, ...edits } : edits;
	const isNew = ! postId;

	dispatch( {
		type: 'REQUEST_POST_UPDATE',
		edits,
		isNew,
	} );

	new wp.api.models.Post( toSend ).save().done( ( newPost ) => {
		dispatch( {
			type: 'REQUEST_POST_UPDATE_SUCCESS',
			post: newPost,
			isNew,
		} );
		if ( isNew && window.history.replaceState ) {
			const [ baseUrl, query ] = window.location.href.split( '?' );
			const qs = parse( query || '' );
			const newUrl = baseUrl + '?' + stringify( {
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
			edits,
			isNew,
		} );
	} );
}
