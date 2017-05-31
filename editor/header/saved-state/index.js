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
	getEditedPostStatus,
} from '../../selectors';

function SavedState( { isNew, isDirty, isSaving, edits, blocks, post, status, onSave } ) {
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

	const onClick = () => onSave( post, { ...edits, status: status || 'draft' }, blocks );

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
		status: getEditedPostStatus( state ),
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
