/**
 * External dependencies
 */
import { noop, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PublishButtonLabel from './label';

export function PostPublishButton( {
	isSaving,
	onStatusChange,
	onSave,
	isBeingScheduled,
	visibility,
	isPublishable,
	isSaveable,
	hasPublishAction,
	onSubmit = noop,
	forceIsSaving,
} ) {
	const isButtonEnabled = isPublishable && isSaveable;

	let publishStatus;
	if ( ! hasPublishAction ) {
		publishStatus = 'pending';
	} else if ( isBeingScheduled ) {
		publishStatus = 'future';
	} else if ( visibility === 'private' ) {
		publishStatus = 'private';
	} else {
		publishStatus = 'publish';
	}

	const onClick = () => {
		onSubmit();
		onStatusChange( publishStatus );
		onSave();
	};

	return (
		<Button
			className="editor-post-publish-button"
			isPrimary
			isLarge
			onClick={ onClick }
			disabled={ ! isButtonEnabled }
			isBusy={ isSaving }
		>
			<PublishButtonLabel forceIsSaving={ forceIsSaving } />
		</Button>
	);
}

export default compose( [
	withSelect( ( select, { forceIsSaving, forceIsDirty } ) => {
		const {
			isSavingPost,
			isEditedPostBeingScheduled,
			getEditedPostVisibility,
			isEditedPostSaveable,
			isEditedPostPublishable,
			getCurrentPost,
			getCurrentPostType,
		} = select( 'core/editor' );
		return {
			isSaving: forceIsSaving || isSavingPost(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			visibility: getEditedPostVisibility(),
			isSaveable: isEditedPostSaveable(),
			isPublishable: forceIsDirty || isEditedPostPublishable(),
			hasPublishAction: get( getCurrentPost(), [ '_links', 'wp:action-publish' ], false ),
			postType: getCurrentPostType(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, savePost } = dispatch( 'core/editor' );
		return {
			onStatusChange: ( status ) => editPost( { status } ),
			onSave: savePost,
		};
	} ),
] )( PostPublishButton );
