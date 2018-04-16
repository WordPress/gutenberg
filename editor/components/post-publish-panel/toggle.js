/**
 * External Dependencies
 */
import { get } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Button, withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import PostPublishButton from '../post-publish-button';

function PostPublishPanelToggle( {
	user,
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
} ) {
	const isButtonEnabled = (
		! isSaving && ! forceIsSaving && isPublishable && isSaveable
	) || isPublished;

	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );
	const isContributor = user.data && ! userCanPublishPosts;
	const showToggle = ! isPublished && ! ( isScheduled && isBeingScheduled ) && ! ( isPending && isContributor );

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
			{ isBeingScheduled ? __( 'Schedule…' ) : __( 'Publish…' ) }
		</Button>
	);
}

export default compose( [
	withSelect( ( select ) =>{
		const {
			isSavingPost,
			isEditedPostSaveable,
			isEditedPostPublishable,
			isCurrentPostPending,
			isCurrentPostPublished,
			isEditedPostBeingScheduled,
			isCurrentPostScheduled,
			getCurrentPostType,
		} = select( 'core/editor' );
		return {
			isSaving: isSavingPost(),
			isSaveable: isEditedPostSaveable(),
			isPublishable: isEditedPostPublishable(),
			isPending: isCurrentPostPending(),
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			postType: getCurrentPostType(),
		};
	} ),
	withAPIData( ( props ) => {
		const { postType } = props;

		return {
			user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
		};
	} ),
] )( PostPublishPanelToggle );
