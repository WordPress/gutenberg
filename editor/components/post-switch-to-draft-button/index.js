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

	const onSwitch = () => {
		// eslint-disable-next-line no-alert
		if ( window.confirm( __( 'Are you sure you want to unpublish this post?' ) ) ) {
			onClick();
		}
	};

	return (
		<Button
			className={ className }
			isLarge
			onClick={ onSwitch }
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
