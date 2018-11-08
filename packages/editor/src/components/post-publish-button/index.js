/**
 * External dependencies
 */
import { noop, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PublishButtonLabel from './label';
export class PostPublishButton extends Component {
	constructor( props ) {
		super( props );
		this.buttonNode = createRef();
	}
	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.buttonNode.current.focus();
		}
	}

	render() {
		const {
			isSaving,
			onStatusChange,
			onSave,
			isBeingScheduled,
			visibility,
			isPublishable,
			isSaveable,
			isPostSavingLocked,
			isPublished,
			hasPublishAction,
			onSubmit = noop,
			forceIsDirty,
			forceIsSaving,
		} = this.props;
		const isButtonDisabled =
			isSaving ||
			forceIsSaving ||
			! isSaveable ||
			isPostSavingLocked ||
			( ! isPublishable && ! forceIsDirty );

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
				ref={ this.buttonNode }
				className="editor-post-publish-button"
				isPrimary
				isLarge
				onClick={ onClick }
				disabled={ isButtonDisabled }
				isBusy={ isSaving && isPublished }
			>
				<PublishButtonLabel forceIsSaving={ forceIsSaving } />
			</Button>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isSavingPost,
			isEditedPostBeingScheduled,
			getEditedPostVisibility,
			isCurrentPostPublished,
			isEditedPostSaveable,
			isEditedPostPublishable,
			isPostSavingLocked,
			getCurrentPost,
			getCurrentPostType,
		} = select( 'core/editor' );
		return {
			isSaving: isSavingPost(),
			isBeingScheduled: isEditedPostBeingScheduled(),
			visibility: getEditedPostVisibility(),
			isSaveable: isEditedPostSaveable(),
			isPostSavingLocked: isPostSavingLocked(),
			isPublishable: isEditedPostPublishable(),
			isPublished: isCurrentPostPublished(),
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
