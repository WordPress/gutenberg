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
	onSaveDraft,
} ) {
	let buttonEnabled = true;
	let buttonText, saveCallback;

	if ( isRequesting ) {
		buttonEnabled = false;
		buttonText = requestIsNewPost
			? wp.i18n.__( 'Saving...' )
			: wp.i18n.__( 'Updating...' );
	} else if ( isSuccessful ) {
		buttonText = requestIsNewPost
			? wp.i18n.__( 'Saved!' )
			: wp.i18n.__( 'Updated!' );
	} else if ( isError ) {
		buttonText = requestIsNewPost
			? wp.i18n.__( 'Save failed' )
			: wp.i18n.__( 'Update failed' );
	} else if ( post && post.id ) {
		buttonText = wp.i18n.__( 'Update' );
	} else {
		buttonText = wp.i18n.__( 'Save draft' );
	}

	if ( post && post.id ) {
		saveCallback = onUpdate;
	} else {
		saveCallback = onSaveDraft;
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

		onSaveDraft( post, blocks ) {
			post.content.raw = wp.blocks.serialize( blocks );
			post.status = 'draft'; // TODO change this after status controls
			savePost( dispatch, post );
		},
	} )
)( PublishButton );
