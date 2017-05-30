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
	onSave,
} ) {
	const buttonEnabled = ! isRequesting;

	let buttonText;
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

	const buttonDisabledHint = process.env.NODE_ENV === 'production'
		? wp.i18n.__( 'The Save button is disabled during early alpha releases.' )
		: null;

	return (
		<Button
			isPrimary
			isLarge
			onClick={ () => onSave( post, edits, blocks ) }
			disabled={ ! buttonEnabled || process.env.NODE_ENV === 'production' }
			title={ buttonDisabledHint }
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
		onSave( post, edits, blocks ) {
			dispatch( savePost( post.id, {
				content: wp.blocks.serialize( blocks ),
				...edits,
			} ) );
		},
	} )
)( PublishButton );
