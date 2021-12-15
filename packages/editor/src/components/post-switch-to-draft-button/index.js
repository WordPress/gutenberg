/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, useViewportMatch } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function SwitchToDraftConfirm( props ) {
	let alertMessage;
	if ( props.isPublished ) {
		alertMessage = __( 'Are you sure you want to unpublish this post?' );
	} else if ( props.isScheduled ) {
		alertMessage = __( 'Are you sure you want to unschedule this post?' );
	}

	return props.showConfirmDialog ? (
		<ConfirmDialog onConfirm={ props.onClick }>
			{ alertMessage }
		</ConfirmDialog>
	) : null;
}

function PostSwitchToDraftButton( {
	isSaving,
	isPublished,
	isScheduled,
	onClick,
} ) {
	const isMobileViewport = useViewportMatch( 'small', '<' );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	if ( ! isPublished && ! isScheduled ) {
		return null;
	}

	return (
		<>
			<Button
				className="editor-post-switch-to-draft"
				onClick={ () => {
					setShowConfirmDialog( true );
				} }
				disabled={ isSaving }
				variant="tertiary"
			>
				{ isMobileViewport ? __( 'Draft' ) : __( 'Switch to draft' ) }
			</Button>
			<SwitchToDraftConfirm
				isPublished={ isPublished }
				isScheduled={ isScheduled }
				onClick={ onClick }
				showConfirmDialog={ showConfirmDialog }
			/>
		</>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isSavingPost,
			isCurrentPostPublished,
			isCurrentPostScheduled,
		} = select( editorStore );
		return {
			isSaving: isSavingPost(),
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, savePost } = dispatch( editorStore );
		return {
			onClick: () => {
				editPost( { status: 'draft' } );
				savePost();
			},
		};
	} ),
] )( PostSwitchToDraftButton );
