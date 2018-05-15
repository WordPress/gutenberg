/**
 * External dependencies
 */
import classnames from 'classnames';
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
import './style.scss';
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
	const isButtonEnabled = ! isSaving && isPublishable && isSaveable;

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

	const className = classnames( 'editor-post-publish-button', {
		'is-saving': isSaving,
	} );

	const onClick = () => {
		onSubmit();
		onStatusChange( publishStatus );
		onSave();
	};

	return (
		<Button
			isPrimary
			isLarge
			onClick={ onClick }
			disabled={ ! isButtonEnabled }
			className={ className }
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
