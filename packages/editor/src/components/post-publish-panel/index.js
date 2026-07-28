/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { Button, Spinner, CheckboxControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useConstrainedTabbing,
	useEvent,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
import { closeSmall } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostPublishButton from '../post-publish-button';
import PostPublishPanelPrepublish from './prepublish';
import PostPublishPanelPostpublish from './postpublish';
import { store as editorStore } from '../../store';

/**
 * Renders a panel for publishing a post.
 *
 * @param {Object}              props                        Component props.
 * @param {boolean}             [props.forceIsDirty]         Whether to force the dirty state.
 * @param {()=>void}            props.onClose                Called when the panel requests to close.
 * @param {React.ComponentType} [props.PostPublishExtension] Component rendered after publishing.
 * @param {React.ComponentType} [props.PrePublishExtension]  Component rendered before publishing.
 *
 * @return {React.JSX.Element} The post publish panel.
 */
export default function PostPublishPanel( {
	forceIsDirty,
	onClose,
	PostPublishExtension,
	PrePublishExtension,
	...propsForPanel
} ) {
	const {
		hasPublishAction,
		isPostTypeViewable,
		isBeingScheduled,
		isDirty,
		isPublished,
		isPublishSidebarEnabled,
		isSaving,
		isSavingNonPostEntityChanges,
		isScheduled,
		currentPostId,
	} = useSelect( ( select ) => {
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
			isSavingNonPostEntityChanges: _isSavingNonPostEntityChanges,
			isPublishSidebarEnabled: _isPublishSidebarEnabled,
		} = select( editorStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			hasPublishAction:
				getCurrentPost()._links?.[ 'wp:action-publish' ] ?? false,
			isPostTypeViewable: postType?.viewable,
			isBeingScheduled: isEditedPostBeingScheduled(),
			isDirty: isEditedPostDirty(),
			isPublished: isCurrentPostPublished(),
			isPublishSidebarEnabled: _isPublishSidebarEnabled(),
			isSaving: isSavingPost() && ! isAutosavingPost(),
			isSavingNonPostEntityChanges: _isSavingNonPostEntityChanges(),
			isScheduled: isCurrentPostScheduled(),
			currentPostId: getCurrentPostId(),
		};
	}, [] );

	const { disablePublishSidebar, enablePublishSidebar } =
		useDispatch( editorStore );

	const cancelButtonRef = useRef( null );
	const wrapperRef = useMergeRefs( [
		useFocusReturn(),
		useConstrainedTabbing(),
	] );

	useEffect( () => {
		cancelButtonRef.current?.focus();
	}, [] );

	// Auto-collapse the publish sidebar when a post is published and the user
	// makes an edit, or when the edited post changes. The panel only mounts
	// for unpublished posts, so `isPublished && isDirty` cannot be true on
	// mount — it implies a publish-then-edit transition.
	const prevPostIdRef = useRef( currentPostId );
	const stableOnClose = useEvent( onClose );
	useEffect( () => {
		const postChanged = currentPostId !== prevPostIdRef.current;
		prevPostIdRef.current = currentPostId;

		if ( postChanged || ( isPublished && ! isSaving && isDirty ) ) {
			stableOnClose();
		}
	}, [ isPublished, isSaving, isDirty, currentPostId, stableOnClose ] );

	function onTogglePublishSidebar() {
		if ( isPublishSidebarEnabled ) {
			disablePublishSidebar();
		} else {
			enablePublishSidebar();
		}
	}

	function onSubmit() {
		if ( ! hasPublishAction || ! isPostTypeViewable ) {
			onClose();
		}
	}

	const isPublishedOrScheduled =
		isPublished || ( isScheduled && isBeingScheduled );
	const isPrePublish = ! isPublishedOrScheduled && ! isSaving;
	const isPostPublish = isPublishedOrScheduled && ! isSaving;

	return (
		<div
			ref={ wrapperRef }
			tabIndex={ -1 }
			className="editor-post-publish-panel"
			{ ...propsForPanel }
		>
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
								ref={ cancelButtonRef }
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
								onSubmit={ onSubmit }
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
					label={ __( 'Always show pre-publish checks.' ) }
					checked={ isPublishSidebarEnabled }
					onChange={ onTogglePublishSidebar }
				/>
			</div>
		</div>
	);
}
