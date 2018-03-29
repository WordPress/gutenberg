/**
 * WordPress Dependencies
 */
import { Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import PostPublishButton from '../post-publish-button';

function PostPublishPanelToggle( {
	isSaving,
	isPublishable,
	isSaveable,
	isPublished,
	isBeingScheduled,
	isPending,
	isScheduled,
	onToggle,
	isOpen,
	forceIsDirty,
	forceIsSaving,
	canPublishPosts,
} ) {
	const isButtonEnabled = (
		! isSaving && ! forceIsSaving && isPublishable && isSaveable
	) || isPublished;

	const showToggle = ! isPublished && ! ( isScheduled && isBeingScheduled ) && ! ( isPending && ! canPublishPosts );

	if ( ! showToggle ) {
		return <PostPublishButton forceIsDirty={ forceIsDirty } forceIsSaving={ forceIsSaving } />;
	}

	return (
		<Button
			className="editor-post-publish-panel__toggle"
			isPrimary
			onClick={ onToggle }
			aria-expanded={ isOpen }
			disabled={ ! isButtonEnabled }
			isBusy={ isSaving && isPublished }
		>
			{ isBeingScheduled ? __( 'Schedule...' ) : __( 'Publish...' ) }
		</Button>
	);
}

export default withSelect(
	( select ) => {
		const {
			getEditedPostAttribute,
			isSavingPost,
			isEditedPostSaveable,
			isEditedPostPublishable,
			isCurrentPostPending,
			isCurrentPostPublished,
			isCurrentPostScheduled,
			isEditedPostBeingScheduled,
		} = select( 'core/editor' );
		const { getUserPostTypeCapability } = select( 'core' );
		return {
			isSaving: isSavingPost(),
			isSaveable: isEditedPostSaveable(),
			isPublishable: isEditedPostPublishable(),
			isPending: isCurrentPostPending(),
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			canPublishPosts: getUserPostTypeCapability( getEditedPostAttribute( 'type' ), 'publish_posts' ),
		};
	},
)( PostPublishPanelToggle );
