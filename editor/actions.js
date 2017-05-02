/**
 * External dependencies
 */
import { get } from 'lodash';

export function savePost( dispatch, post ) {
	const isNew = ! post.id;
	dispatch( {
		type: 'POST_UPDATE_REQUEST',
		post,
		isNew,
	} );
	new wp.api.models.Post( post ).save().done( ( newPost ) => {
		dispatch( {
			type: 'POST_UPDATE_REQUEST_SUCCESS',
			post: newPost,
			isNew,
		} );
		if ( isNew && window.history.replaceState ) {
			window.history.replaceState(
				{},
				'Post ' + newPost.id,
				window.location.href.replace( /&post_id=[^&]*$/, '' )
					+ '&post_id=' + newPost.id
			);
		}
	} ).fail( ( err ) => {
		dispatch( {
			type: 'POST_UPDATE_REQUEST_FAILURE',
			error: get( err, 'responseJSON', {
				code: 'unknown_error',
				message: wp.i18n.__( 'An unknown error occurred.' ),
			} ),
			post,
			isNew,
		} );
	} );
}
