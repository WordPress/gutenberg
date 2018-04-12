/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';

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
	canPublishPosts,
	onSubmit = noop,
	forceIsSaving,
} ) {
	const isButtonEnabled = ! isSaving && isPublishable && isSaveable;

	let publishStatus;
	if ( canPublishPosts === false ) {
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
	withSelect(
		( select, { forceIsSaving, forceIsDirty } ) => {
			const {
				getEditedPostAttribute,
				isSavingPost,
				isEditedPostBeingScheduled,
				getEditedPostVisibility,
				isEditedPostSaveable,
				isEditedPostPublishable,
			} = select( 'core/editor' );
			const { getUserPostTypeCapability } = select( 'core' );
			return {
				isSaving: forceIsSaving || isSavingPost(),
				isBeingScheduled: isEditedPostBeingScheduled(),
				visibility: getEditedPostVisibility(),
				isSaveable: isEditedPostSaveable(),
				isPublishable: forceIsDirty || isEditedPostPublishable(),
				canPublishPosts: getUserPostTypeCapability( getEditedPostAttribute( 'type' ), 'publish_posts' ),
			};
		},
	),
	withDispatch(
		( dispatch ) => {
			const { editPost, savePost } = dispatch( 'core/editor' );
			return {
				onStatusChange: ( status ) => editPost( { status } ),
				onSave: savePost,
			};
		}
	),
] )( PostPublishButton );
