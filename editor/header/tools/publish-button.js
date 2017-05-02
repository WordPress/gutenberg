/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { savePost } from 'actions';

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

export default connect(
	( state ) => ( {
		blocks: state.editor.blockOrder.map( ( uid ) => (
			state.editor.blocksByUid[ uid ]
		) ),
		post: state.editor.post,
		isRequesting: state.saving.requesting,
		isSuccessful: state.saving.successful,
		isError: !! state.saving.error,
		requestIsNewPost: state.saving.isNew,
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
