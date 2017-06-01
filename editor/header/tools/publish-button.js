/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button } from 'components';

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
	isEditedPostAlreadyPublished,
	isEditedPostBeingScheduled,
} from '../../selectors';

function PublishButton( {
	post,
	edits,
	dirty,
	blocks,
	isSaving,
	isPublished,
	onSave,
	isBeingScheduled,
} ) {
	const buttonEnabled = ! isSaving &&
		( dirty || ( ! isPublished && ! isBeingScheduled )
	);
	let buttonText;
	if ( isPublished ) {
		buttonText = wp.i18n.__( 'Update' );
	} else if ( isBeingScheduled ) {
		buttonText = wp.i18n.__( 'Schedule' );
	} else {
		buttonText = wp.i18n.__( 'Publish' );
	}
	let publishStatus;
	if ( isPublished ) {
		publishStatus = post.status;
	} else if ( isBeingScheduled ) {
		publishStatus = 'future';
	} else {
		publishStatus = 'publish';
	}
	const className = classnames( 'editor-tools__publish-button', { 'is-saving': isSaving } );
	const onClick = () => onSave( post, { status: publishStatus, ...edits }, blocks );

	const buttonDisabledHint = process.env.NODE_ENV === 'production'
		? wp.i18n.__( 'The Save button is disabled during early alpha releases.' )
		: null;

	return (
		<Button
			isPrimary
			isLarge
			onClick={ onClick }
			disabled={ ! buttonEnabled || process.env.NODE_ENV === 'production' }
			title={ buttonDisabledHint }
			className={ className }
		>
			{ buttonText }
		</Button>
	);
}

export default connect(
	( state ) => ( {
		post: getCurrentPost( state ),
		edits: getPostEdits( state ),
		blocks: getBlocks( state ),
		dirty: isEditedPostDirty( state ),
		isSaving: isSavingPost( state ),
		isPublished: isEditedPostAlreadyPublished( state ),
		isBeingScheduled: isEditedPostBeingScheduled( state ),
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
