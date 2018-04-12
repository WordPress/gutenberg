/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { IconButton, Spinner } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostPublishButton from '../post-publish-button';
import PostPublishPanelPrepublish from './prepublish';
import PostPublishPanelPostpublish from './postpublish';

class PostPublishPanel extends Component {
	constructor() {
		super( ...arguments );
		this.onSubmit = this.onSubmit.bind( this );
		this.state = {
			loading: false,
			submitted: false,
		};
	}

	componentWillReceiveProps( newProps ) {
		if (
			! this.state.submitted &&
			! newProps.isSaving &&
			( newProps.isPublished || newProps.isScheduled )
		) {
			this.setState( {
				submitted: true,
				loading: false,
			} );
		}
	}

	componentDidUpdate( prevProps ) {
		// Automatically collapse the publish sidebar when a post
		// is published and the user makes an edit.
		if ( prevProps.isPublished && this.props.isDirty ) {
			this.props.onClose();
		}
	}

	onSubmit() {
		const { canPublishPosts, onClose } = this.props;
		if ( canPublishPosts === false ) {
			onClose();
			return;
		}
		this.setState( { loading: true } );
	}

	render() {
		const { isScheduled, onClose, forceIsDirty, forceIsSaving } = this.props;
		const { loading, submitted } = this.state;
		return (
			<div className="editor-post-publish-panel">
				<div className="editor-post-publish-panel__header">
					{ ! submitted && (
						<div className="editor-post-publish-panel__header-publish-button">
							<PostPublishButton onSubmit={ this.onSubmit } forceIsDirty={ forceIsDirty } forceIsSaving={ forceIsSaving } />
						</div>
					) }
					{ submitted && (
						<div className="editor-post-publish-panel__header-published">
							{ isScheduled ? __( 'Scheduled' ) : __( 'Published' ) }
						</div>
					) }
					<IconButton
						onClick={ onClose }
						icon="no-alt"
						label={ __( 'Close Publish Panel' ) }
					/>
				</div>
				<div className="editor-post-publish-panel__content">
					{ ! loading && ! submitted && <PostPublishPanelPrepublish /> }
					{ loading && ! submitted && <Spinner /> }
					{ submitted && <PostPublishPanelPostpublish /> }
				</div>
			</div>
		);
	}
}

export default withSelect(
	( select ) => {
		const {
			getEditedPostAttribute,
			isCurrentPostPublished,
			isCurrentPostScheduled,
			isSavingPost,
			isEditedPostDirty,
		} = select( 'core/editor' );
		const { getUserPostTypeCapability } = select( 'core' );
		return {

			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
			isSaving: isSavingPost(),
			isDirty: isEditedPostDirty(),
			canPublishPosts: getUserPostTypeCapability( getEditedPostAttribute( 'type' ), 'publish_posts' ),
		};
	},
)( PostPublishPanel );
