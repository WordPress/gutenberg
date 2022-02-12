/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { PostSavedState, PostPreviewButton } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FullscreenModeClose from './fullscreen-mode-close';
import HeaderToolbar from './header-toolbar';
import MoreMenu from './more-menu';
import PostPublishButtonOrToggle from './post-publish-button-or-toggle';
import { default as DevicePreview } from '../device-preview';
import MainDashboardButton from './main-dashboard-button';
import { store as editPostStore } from '../../store';
import TemplateTitle from './template-title';
import PostTitle from './post-title';

function Header( { setEntitiesSavedStatesCallback } ) {
	const {
		hasActiveMetaboxes,
		isPublishSidebarOpened,
		isSaving,
		showIconLabels,
		hasReducedUI,
		isTemplateMode,
	} = useSelect(
		( select ) => ( {
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			isPublishSidebarOpened: select(
				editPostStore
			).isPublishSidebarOpened(),
			isSaving: select( editPostStore ).isSavingMetaBoxes(),
			showIconLabels: select( editPostStore ).isFeatureActive(
				'showIconLabels'
			),
			hasReducedUI: select( editPostStore ).isFeatureActive(
				'reducedUI'
			),
			isTemplateMode: select( editPostStore ).isEditingTemplate(),
		} ),
		[]
	);

	const isLargeViewport = useViewportMatch( 'large' );

	const classes = classnames( 'edit-post-header', {
		'has-reduced-ui': hasReducedUI,
	} );

	return (
		<div className={ classes }>
			<div className="edit-post-header_start">
				<div className="edit-post-header__toolbar">
					<MainDashboardButton.Slot>
						<FullscreenModeClose />
					</MainDashboardButton.Slot>
					<HeaderToolbar />
				</div>
			</div>
			<div className="edit-post-header_center">
				{ isTemplateMode ? <TemplateTitle /> : <PostTitle /> }
			</div>
			<div className="edit-post-header_end">
				<div className="edit-post-header__settings">
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
				</div>
			</div>
		</div>
	);
}

export default Header;
