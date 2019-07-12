/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { withViewportMatch } from '@wordpress/viewport';

function PostSwitchToDraftButton( {
	isSaving,
	isPublished,
	isScheduled,
	onClick,
	isMobileViewport,
} ) {
	if ( ! isPublished && ! isScheduled ) {
		return null;
	}

	const onSwitch = () => {
		let alertMessage;
		if ( isPublished ) {
			alertMessage = __( 'Are you sure you want to unpublish this post?' );
		} else if ( isScheduled ) {
			alertMessage = __( 'Are you sure you want to unschedule this post?' );
		}
		// eslint-disable-next-line no-alert
		if ( window.confirm( alertMessage ) ) {
			onClick();
		}
	};

	return (
		<Button
			className="editor-post-switch-to-draft"
			onClick={ onSwitch }
			disabled={ isSaving }
			isTertiary
		>
			{ isMobileViewport ? __( 'Draft' ) : __( 'Switch to Draft' ) }
		</Button>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { isSavingPost, isCurrentPostPublished, isCurrentPostScheduled } = select( 'core/editor' );
		return {
			isSaving: isSavingPost(),
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, savePost } = dispatch( 'core/editor' );
		return {
			onClick: () => {
				editPost( { status: 'draft' } );
				savePost();
			},
		};
	} ),
	withViewportMatch( { isMobileViewport: '< small' } ),
] )( PostSwitchToDraftButton );

