/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
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
	}

	componentDidUpdate( prevProps ) {
		// Automatically collapse the publish sidebar when a post
		// is published and the user makes an edit.
		if (
			prevProps.isPublished &&
			! this.props.isSaving &&
			this.props.isDirty
		) {
			this.props.onClose();
		}

		// Automatically close the publish sidebar when showPostPublishPanel is unchecked and post is published.
		if (
			prevProps.isPublished &&
			! this.props.isSaving &&
			! prevProps.showPostPublishPanel
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
			showPrePublishPanel,
			showPostPublishPanel,

			isScheduled,
			isSaving,
			isSavingNonPostEntityChanges,
			onClose,

			onTogglePublishSidebar,
			PostPublishExtension,
			PrePublishExtension,

			handleTogglePrePublishPanel,
			handleTogglePostPublishPanel,

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

		const isPrePublish =
			! isPublishedOrScheduled && ! isSaving && showPrePublishPanel;
		const isPostPublish =
			isPublishedOrScheduled && ! isSaving && showPostPublishPanel;

		return (
			<div className="editor-post-publish-panel" { ...propsForPanel }>
				<div className="editor-post-publish-panel__header">
					{ isPostPublish ? (
						<Button
							onClick={ onClose }
							icon={ closeSmall }
							label={ __( 'Close panel' ) }
						/>
					) : (
						<>
							<div className="editor-post-publish-panel__header-publish-button">
								<PostPublishButton
									focusOnMount
									onSubmit={ this.onSubmit }
									forceIsDirty={ forceIsDirty }
								/>
							</div>
							<div className="editor-post-publish-panel__header-cancel-button">
								<Button
									__experimentalIsFocusable
									disabled={ isSavingNonPostEntityChanges }
									onClick={ onClose }
									variant="secondary"
									size="compact"
								>
									{ __( 'Cancel' ) }
								</Button>
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
					<CheckboxControl
						label={ 'Show Pre-Publish Panel' }
						checked={ showPrePublishPanel }
						onChange={ handleTogglePrePublishPanel }
					/>
					<CheckboxControl
						label={ 'Show Post-Publish Panel' }
						checked={ showPostPublishPanel }
						onChange={ handleTogglePostPublishPanel }
					/>
				</div>
			</div>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getPostType } = select( coreStore );
		const {
			getCurrentPost,
			getEditedPostAttribute,
			isCurrentPostPublished,
			isCurrentPostScheduled,
			isEditedPostBeingScheduled,
			isEditedPostDirty,
			isAutosavingPost,
			isSavingPost,
			isSavingNonPostEntityChanges,
		} = select( editorStore );
		const {
			isPublishSidebarEnabled,
			showPrePublishPanel,
			showPostPublishPanel,
		} = select( editorStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			hasPublishAction:
				getCurrentPost()._links?.[ 'wp:action-publish' ] ?? false,
			isPostTypeViewable: postType?.viewable,
			isBeingScheduled: isEditedPostBeingScheduled(),
			isDirty: isEditedPostDirty(),
			isPublished: isCurrentPostPublished(),
			isPublishSidebarEnabled: isPublishSidebarEnabled(),
			showPrePublishPanel: showPrePublishPanel(),
			showPostPublishPanel: showPostPublishPanel(),
			isSaving: isSavingPost() && ! isAutosavingPost(),
			isSavingNonPostEntityChanges: isSavingNonPostEntityChanges(),
			isScheduled: isCurrentPostScheduled(),
		};
	} ),
	withDispatch(
		(
			dispatch,
			{
				isPublishSidebarEnabled,
				showPrePublishPanel,
				showPostPublishPanel,
			}
		) => {
			const {
				disablePublishSidebar,
				enablePublishSidebar,
				disablePrePublishPanel,
				enablePrePublishPanel,
				disablePostPublishPanel,
				enablePostPublishPanel,
			} = dispatch( editorStore );
			return {
				onTogglePublishSidebar: () => {
					if ( isPublishSidebarEnabled ) {
						disablePublishSidebar();
					} else {
						enablePublishSidebar();
					}
				},
				handleTogglePrePublishPanel: () => {
					if ( showPrePublishPanel ) {
						disablePrePublishPanel();
					} else {
						enablePrePublishPanel();
					}
				},
				handleTogglePostPublishPanel: () => {
					if ( showPostPublishPanel ) {
						disablePostPublishPanel();
					} else {
						enablePostPublishPanel();
					}
				},
			};
		}
	),
	withFocusReturn,
	withConstrainedTabbing,
] )( PostPublishPanel );
