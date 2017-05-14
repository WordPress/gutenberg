/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import Button from 'components/button';

/**
 * Internal dependencies
 */
import { savePost } from '../../actions';
import {
	isEditedPostDirty,
	getCurrentPost,
	getPostEdits,
	getBlocks,
	isSavingPost,
	didPostSaveRequestSucceed,
	didPostSaveRequestFail,
	isSavingNewPost,
} from '../../selectors';

function PublishButton( {
	post,
	edits,
	dirty,
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
	} else if ( ! dirty && isSuccessful ) {
		buttonText = requestIsNewPost
			? wp.i18n.__( 'Saved!' )
			: wp.i18n.__( 'Updated!' );
	} else if ( ! dirty && isError ) {
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
		post: getCurrentPost( state ),
		edits: getPostEdits( state ),
		dirty: isEditedPostDirty( state ),
		blocks: getBlocks( state ),
		isRequesting: isSavingPost( state ),
		isSuccessful: didPostSaveRequestSucceed( state ),
		isError: !! didPostSaveRequestFail( state ),
		requestIsNewPost: isSavingNewPost( state ),
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
