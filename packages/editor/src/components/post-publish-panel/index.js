/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import {
	Button,
	Spinner,
	CheckboxControl,
	withFocusReturn,
	withConstrainedTabbing,
} from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { closeSmall } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostPublishButton from '../post-publish-button';
import PostPublishPanelPrepublish from './prepublish';
import PostPublishPanelPostpublish from './postpublish';
import { store as editorStore } from '../../store';

export class PostPublishPanel extends Component {
	constructor() {
		super( ...arguments );
		this.onSubmit = this.onSubmit.bind( this );
		this.cancelButtonNode = createRef();
	}

	componentDidMount() {
		// This timeout is necessary to make sure the `useEffect` hook of
		// `useFocusReturn` gets the correct element (the button that opens the
		// PostPublishPanel) otherwise it will get this button.
		this.timeoutID = setTimeout( () => {
			this.cancelButtonNode.current.focus();
		}, 0 );
	}

	componentWillUnmount() {
		clearTimeout( this.timeoutID );
	}

	componentDidUpdate( prevProps ) {
		// Automatically collapse the publish sidebar when a post
		// is published and the user makes an edit.
		if (
			( prevProps.isPublished &&
				! this.props.isSaving &&
				this.props.isDirty ) ||
			this.props.currentPostId !== prevProps.currentPostId
		) {
			this.props.onClose();
		}
	}

	onSubmit() {
		const { onClose, hasPublishAction, isPostTypeViewable } = this.props;
		if ( ! hasPublishAction || ! isPostTypeViewable ) {
			onClose();
		}
	}

	render() {
		const {
			forceIsDirty,
			isBeingScheduled,
			isPublished,
			isPublishSidebarEnabled,
			isScheduled,
			isSaving,
			isSavingNonPostEntityChanges,
			onClose,
			onTogglePublishSidebar,
			PostPublishExtension,
			PrePublishExtension,
			currentPostId,
			...additionalProps
		} = this.props;
		const {
			hasPublishAction,
			isDirty,
			isPostTypeViewable,
			...propsForPanel
		} = additionalProps;
		const isPublishedOrScheduled =
			isPublished || ( isScheduled && isBeingScheduled );
		const isPrePublish = ! isPublishedOrScheduled && ! isSaving;
		const isPostPublish = isPublishedOrScheduled && ! isSaving;
		return (
			<div className="editor-post-publish-panel" { ...propsForPanel }>
				<div className="editor-post-publish-panel__header">
					{ isPostPublish ? (
						<Button
							size="compact"
							onClick={ onClose }
							icon={ closeSmall }
							label={ __( 'Close panel' ) }
						/>
					) : (
						<>
							<div className="editor-post-publish-panel__header-cancel-button">
								<Button
									ref={ this.cancelButtonNode }
									accessibleWhenDisabled
									disabled={ isSavingNonPostEntityChanges }
									onClick={ onClose }
									variant="secondary"
									size="compact"
								>
									{ __( 'Cancel' ) }
								</Button>
							</div>
							<div className="editor-post-publish-panel__header-publish-button">
								<PostPublishButton
									onSubmit={ this.onSubmit }
									forceIsDirty={ forceIsDirty }
								/>
							</div>
						</>
					) }
				</div>
				<div className="editor-post-publish-panel__content">
					{ isPrePublish && (
						<PostPublishPanelPrepublish>
							{ PrePublishExtension && <PrePublishExtension /> }
						</PostPublishPanelPrepublish>
					) }
					{ isPostPublish && (
						<PostPublishPanelPostpublish focusOnMount>
							{ PostPublishExtension && <PostPublishExtension /> }
						</PostPublishPanelPostpublish>
					) }
					{ isSaving && <Spinner /> }
				</div>
				<div className="editor-post-publish-panel__footer">
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( 'Always show pre-publish checks.' ) }
						checked={ isPublishSidebarEnabled }
						onChange={ onTogglePublishSidebar }
					/>
				</div>
			</div>
		);
	}
}

/**
 * Renders a panel for publishing a post.
 */
export default compose( [
	withSelect( ( select ) => {
		const { getPostType } = select( coreStore );
		const {
			getCurrentPost,
			getCurrentPostId,
			getEditedPostAttribute,
			isCurrentPostPublished,
			isCurrentPostScheduled,
			isEditedPostBeingScheduled,
			isEditedPostDirty,
			isAutosavingPost,
			isSavingPost,
			isSavingNonPostEntityChanges,
		} = select( editorStore );
		const { isPublishSidebarEnabled } = select( editorStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			hasPublishAction:
				getCurrentPost()._links?.[ 'wp:action-publish' ] ?? false,
			isPostTypeViewable: postType?.viewable,
			isBeingScheduled: isEditedPostBeingScheduled(),
			isDirty: isEditedPostDirty(),
			isPublished: isCurrentPostPublished(),
			isPublishSidebarEnabled: isPublishSidebarEnabled(),
			isSaving: isSavingPost() && ! isAutosavingPost(),
			isSavingNonPostEntityChanges: isSavingNonPostEntityChanges(),
			isScheduled: isCurrentPostScheduled(),
			currentPostId: getCurrentPostId(),
		};
	} ),
	withDispatch( ( dispatch, { isPublishSidebarEnabled } ) => {
		const { disablePublishSidebar, enablePublishSidebar } =
			dispatch( editorStore );
		return {
			onTogglePublishSidebar: () => {
				if ( isPublishSidebarEnabled ) {
					disablePublishSidebar();
				} else {
					enablePublishSidebar();
				}
			},
		};
	} ),
	withFocusReturn,
	withConstrainedTabbing,
] )( PostPublishPanel );
