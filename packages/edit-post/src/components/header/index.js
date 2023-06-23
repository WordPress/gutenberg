/**
 * WordPress dependencies
 */
import { PostSavedState, PostPreviewButton } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';
import { __unstableMotion as motion } from '@wordpress/components';

/**
 * Internal dependencies
 */
import FullscreenModeClose from './fullscreen-mode-close';
import HeaderToolbar from './header-toolbar';
import MoreMenu from './more-menu';
import PostPublishButtonOrToggle from './post-publish-button-or-toggle';
import { default as DevicePreview } from '../device-preview';
import ViewLink from '../view-link';
import MainDashboardButton from './main-dashboard-button';
import { store as editPostStore } from '../../store';
import DocumentTitle from './document-title';

function Header( { setEntitiesSavedStatesCallback } ) {
	const isLargeViewport = useViewportMatch( 'large' );
	const {
		hasActiveMetaboxes,
		isPublishSidebarOpened,
		isSaving,
		showIconLabels,
	} = useSelect(
		( select ) => ( {
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			isPublishSidebarOpened:
				select( editPostStore ).isPublishSidebarOpened(),
			isSaving: select( editPostStore ).isSavingMetaBoxes(),
			showIconLabels:
				select( editPostStore ).isFeatureActive( 'showIconLabels' ),
		} ),
		[]
	);

	const slideY = {
		hidden: { y: '-50px' },
		hover: { y: 0, transition: { type: 'tween', delay: 0.2 } },
	};

	const slideX = {
		hidden: { x: '-100%' },
		hover: { x: 0, transition: { type: 'tween', delay: 0.2 } },
	};

	return (
		<div className="edit-post-header">
			<MainDashboardButton.Slot>
				<motion.div
					variants={ slideX }
					transition={ { type: 'tween', delay: 0.8 } }
				>
					<FullscreenModeClose showTooltip />
				</motion.div>
			</MainDashboardButton.Slot>
			<motion.div
				variants={ slideY }
				transition={ { type: 'tween', delay: 0.8 } }
				className="edit-post-header__toolbar"
			>
				<HeaderToolbar />
				<div className="edit-post-header__document-title">
					<DocumentTitle />
				</div>
			</motion.div>
			<motion.div
				variants={ slideY }
				transition={ { type: 'tween', delay: 0.8 } }
				className="edit-post-header__settings"
			>
				{ ! isPublishSidebarOpened && (
					// This button isn't completely hidden by the publish sidebar.
					// We can't hide the whole toolbar when the publish sidebar is open because
					// we want to prevent mounting/unmounting the PostPublishButtonOrToggle DOM node.
					// We track that DOM node to return focus to the PostPublishButtonOrToggle
					// when the publish sidebar has been closed.
					<PostSavedState
						forceIsDirty={ hasActiveMetaboxes }
						forceIsSaving={ isSaving }
						showIconLabels={ showIconLabels }
					/>
				) }
				<DevicePreview />
				<PostPreviewButton
					forceIsAutosaveable={ hasActiveMetaboxes }
					forcePreviewLink={ isSaving ? null : undefined }
				/>
				<ViewLink />
				<PostPublishButtonOrToggle
					forceIsDirty={ hasActiveMetaboxes }
					forceIsSaving={ isSaving }
					setEntitiesSavedStatesCallback={
						setEntitiesSavedStatesCallback
					}
				/>
				{ ( isLargeViewport || ! showIconLabels ) && (
					<>
						<PinnedItems.Slot scope="core/edit-post" />
						<MoreMenu showIconLabels={ showIconLabels } />
					</>
				) }
				{ showIconLabels && ! isLargeViewport && (
					<MoreMenu showIconLabels={ showIconLabels } />
				) }
			</motion.div>
		</div>
	);
}

export default Header;
