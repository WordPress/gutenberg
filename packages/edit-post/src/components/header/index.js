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
import TemplateSaveButton from './template-save-button';

function Header( { setEntitiesSavedStatesCallback } ) {
	const {
		hasActiveMetaboxes,
		isPublishSidebarOpened,
		isSaving,
		showIconLabels,
		hasReducedUI,
		isEditingTemplate,
	} = useSelect(
		( select ) => ( {
			hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
			isPublishSidebarOpened: select(
				'core/edit-post'
			).isPublishSidebarOpened(),
			isSaving: select( 'core/edit-post' ).isSavingMetaBoxes(),
			showIconLabels: select( 'core/edit-post' ).isFeatureActive(
				'showIconLabels'
			),
			hasReducedUI: select( 'core/edit-post' ).isFeatureActive(
				'reducedUI'
			),
			isEditingTemplate: select( 'core/edit-post' ).isEditingTemplate(),
		} ),
		[]
	);

	const isLargeViewport = useViewportMatch( 'large' );

	const classes = classnames( 'edit-post-header', {
		'has-reduced-ui': hasReducedUI,
	} );

	return (
		<div className={ classes }>
			<MainDashboardButton.Slot>
				<FullscreenModeClose />
			</MainDashboardButton.Slot>
			<div className="edit-post-header__toolbar">
				<HeaderToolbar />
			</div>
			<div className="edit-post-header__settings">
				{ ! isEditingTemplate && (
					<>
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
					</>
				) }
				{ isEditingTemplate && <TemplateSaveButton /> }
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
	);
}

export default Header;
