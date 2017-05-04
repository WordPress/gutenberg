/**
 * External dependencies
 */
import { get } from 'lodash';

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
			window.history.replaceState(
				{},
				'Post ' + newPost.id,
				window.location.href.replace( /&post_id=[^&]*$/, '' )
					+ '&post_id=' + newPost.id
			);
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
