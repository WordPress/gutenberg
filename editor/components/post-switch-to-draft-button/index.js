/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { editPost, savePost } from '../../store/actions';
import {
	isSavingPost,
	isCurrentPostPublished,
} from '../../store/selectors';

function PostSwitchToDraftButton( { className, isSaving, isPublished, onClick } ) {
	if ( ! isPublished ) {
		return null;
	}

	return (
		<Button
			className={ className }
			isLarge
			onClick={ onClick }
			disabled={ isSaving }
		>
			{ __( 'Switch to Draft' ) }
		</Button>
	);
}

const applyConnect = connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isPublished: isCurrentPostPublished( state ),
	} ),
	{
		onClick: () => [
			editPost( { status: 'draft' } ),
			savePost(),
		],
	}
);

export default applyConnect( PostSwitchToDraftButton );
