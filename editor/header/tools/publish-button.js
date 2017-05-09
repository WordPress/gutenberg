/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { serialize } from 'blocks';
import Button from 'components/button';
import { __ } from 'i18n';

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
	isSavingNewPost
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
			? __( 'Saving…' )
			: __( 'Updating…' );
	} else if ( ! dirty && isSuccessful ) {
		buttonText = requestIsNewPost
			? __( 'Saved!' )
			: __( 'Updated!' );
	} else if ( ! dirty && isError ) {
		buttonText = requestIsNewPost
			? __( 'Save failed' )
			: __( 'Update failed' );
	} else if ( post && post.id ) {
		buttonText = __( 'Update' );
	} else {
		buttonText = __( 'Save draft' );
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
				content: serialize( blocks ),
				...edits,
			} );
		},

		onSaveDraft( post, edits, blocks ) {
			savePost( dispatch, null /* is a new post */, {
				content: serialize( blocks ),
				status: 'draft', // TODO change this after status controls
				...edits,
			} );
		},
	} )
)( PublishButton );
