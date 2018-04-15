/**
 * External Dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress Dependencies
 */
import { Button, withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import PostPublishButton from '../post-publish-button';
import {
	isSavingPost,
	isEditedPostSaveable,
	isEditedPostPublishable,
	isCurrentPostPending,
	isCurrentPostPublished,
	isEditedPostBeingScheduled,
	isCurrentPostScheduled,
	getCurrentPostType,
} from '../../store/selectors';

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

const applyConnect = connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
		isPending: isCurrentPostPending( state ),
		isPublished: isCurrentPostPublished( state ),
		isScheduled: isCurrentPostScheduled( state ),
		isBeingScheduled: isEditedPostBeingScheduled( state ),
		postType: getCurrentPostType( state ),
	} ),
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postType } = props;

	return {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PostPublishPanelToggle );
