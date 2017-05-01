/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import Button from 'components/button';

function PublishButton( {
	blocks,
	post,
	isSuccessful,
	isRequesting,
	isError,
	requestIsNewPost,
	onUpdate,
	onPublish
} ) {
	let buttonEnabled = true;
	let buttonText, saveCallback;

	if ( isRequesting ) {
		buttonEnabled = false;
		if ( requestIsNewPost ) {
			buttonText = wp.i18n.__( 'Publishing...' );
		} else {
			buttonText = wp.i18n.__( 'Updating...' );
		}
	} else if ( isSuccessful ) {
		if ( requestIsNewPost ) {
			buttonText = wp.i18n.__( 'Published!' );
		} else {
			buttonText = wp.i18n.__( 'Updated!' );
		}
	} else if ( isError ) {
		if ( requestIsNewPost ) {
			buttonText = wp.i18n.__( 'Publish failed' );
		} else {
			buttonText = wp.i18n.__( 'Update failed' );
		}
	} else if ( post && post.id ) {
		buttonText = wp.i18n.__( 'Update' );
	} else {
		buttonText = wp.i18n.__( 'Publish' );
	}

	if ( post && post.id ) {
		saveCallback = onUpdate;
	} else {
		saveCallback = onPublish;
	}

	return (
		<Button
			isPrimary
			isLarge
			onClick={ () => saveCallback( post, blocks ) }
			disabled={ ! buttonEnabled }
		>
			{ buttonText }
		</Button>
	);
}

function savePost( dispatch, post ) {
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

export default connect(
	( state ) => ( {
		blocks: state.editor.blockOrder.map( ( uid ) => (
			state.editor.blocksByUid[ uid ]
		) ),
		post: state.editor.post,
		isRequesting: state.api.requesting,
		isSuccessful: state.api.successful,
		isError: !! state.api.error,
		requestIsNewPost: state.api.isNew,
	} ),
	( dispatch ) => ( {
		onUpdate( post, blocks ) {
			post.content.raw = wp.blocks.serialize( blocks );
			savePost( dispatch, post );
		},

		onPublish( post, blocks ) {
			post.content.raw = wp.blocks.serialize( blocks );
			post.status = 'publish'; // TODO draft first?
			savePost( dispatch, post );
		},
	} )
)( PublishButton );
