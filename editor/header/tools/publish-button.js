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
	post,
	edits,
	blocks,
	isSuccessful,
	isRequesting,
	isError,
	requestIsNewPost,
	onUpdate,
	onSaveDraft,
} ) {
	const buttonEnabled = ! isRequesting;
	let buttonText, saveCallback;

	if ( isRequesting ) {
		buttonText = requestIsNewPost
			? wp.i18n.__( 'Saving…' )
			: wp.i18n.__( 'Updating…' );
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
			onClick={ () => saveCallback( post, edits, blocks ) }
			disabled={ ! buttonEnabled }
		>
			{ buttonText }
		</Button>
	);
}

export default connect(
	( state ) => ( {
		post: state.currentPost,
		edits: state.editor.edits,
		blocks: state.editor.blockOrder.map( ( uid ) => (
			state.editor.blocksByUid[ uid ]
		) ),
		isRequesting: state.saving.requesting,
		isSuccessful: state.saving.successful,
		isError: !! state.saving.error,
		requestIsNewPost: state.saving.isNew,
	} ),
	( dispatch ) => ( {
		onUpdate( post, edits, blocks ) {
			savePost( dispatch, post.id, {
				content: wp.blocks.serialize( blocks ),
				...edits,
			} );
		},

		onSaveDraft( post, edits, blocks ) {
			savePost( dispatch, null /* is a new post */, {
				content: wp.blocks.serialize( blocks ),
				status: 'draft', // TODO change this after status controls
				...edits,
			} );
		},
	} )
)( PublishButton );
