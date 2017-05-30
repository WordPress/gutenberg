/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Dashicon, Button } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { savePost } from '../../actions';
import {
	isEditedPostNew,
	isEditedPostDirty,
	isSavingPost,
	getCurrentPost,
	getPostEdits,
	getBlocks,
	isEditedPostAlreadyPublished,
} from '../../selectors';

function SavedState( { isNew, isDirty, isSaving, isPublished, edits, blocks, post, onSave } ) {
	const className = 'editor-saved-state';

	if ( isSaving ) {
		return (
			<div className={ className }>
				Saving
			</div>
		);
	}
	if ( ! isNew && ! isDirty ) {
		return (
			<div className={ className }>
				<Dashicon icon={ 'saved' } />
				{ wp.i18n.__( 'Saved' ) }
			</div>
		);
	}

	const statusEdits = isPublished ? {} : { status: 'draft' };
	const onClick = () => onSave( post, { ...edits, ...statusEdits }, blocks );

	return (
		<Button className={ classnames( className, 'button-link' ) } onClick={ onClick }>
			{ wp.i18n.__( 'Save' ) }
		</Button>
	);
}

export default connect(
	( state ) => ( {
		post: getCurrentPost( state ),
		edits: getPostEdits( state ),
		blocks: getBlocks( state ),
		isNew: isEditedPostNew( state ),
		isDirty: isEditedPostDirty( state ),
		isSaving: isSavingPost( state ),
		isPublished: isEditedPostAlreadyPublished( state ),
	} ),
	( dispatch ) => ( {
		onSave( post, edits, blocks ) {
			dispatch( savePost( post.id, {
				content: wp.blocks.serialize( blocks ),
				...edits,
			} ) );
		},
	} )
)( SavedState );
