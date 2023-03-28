/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PostSavedState, PostPreviewButton } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { useViewportMatch } from '@wordpress/compose';
import {
	__unstableMotion as motion,
	Button,
	ToolbarItem,
} from '@wordpress/components';
import {
	NavigableToolbar,
	store as blockEditorStore,
	BlockToolbar,
} from '@wordpress/block-editor';
import { tool, arrowDown } from '@wordpress/icons';

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
import InserterButton from './inserter-button';

function MaybeHide( { children, isHidden } ) {
	if ( isHidden ) {
		return <div className="maybeHide">{ children }</div>;
	}
	return children;
}

function ShowDocumentToolbarButton( { onClick } ) {
	return (
		<ToolbarItem
			as={ Button }
			className="edit-post-header-toolbar__document-tools-toggle"
			variant="primary"
			icon={ tool }
			onClick={ onClick }
		/>
	);
}

function ShowBlockToolbarButton( { onClick } ) {
	return (
		<ToolbarItem
			as={ Button }
			className="edit-post-header-toolbar__block-tools-toggle"
			variant="primary"
			icon={ arrowDown }
			onClick={ onClick }
		/>
	);
}

function Header( { setEntitiesSavedStatesCallback } ) {
	const isLargeViewport = useViewportMatch( 'large' );
	const {
		hasActiveMetaboxes,
		isPublishSidebarOpened,
		isSaving,
		hasFixedToolbar,
		hasSelectedBlocks,
		showIconLabels,
		isDistractionFreeMode,
		isNavigationMode,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getSelectedBlockClientIds,
			isNavigationMode: _isNavigationMode,
		} = select( blockEditorStore );
		const settings = getSettings();
		const _selectedBlockClientIds = getSelectedBlockClientIds();
		return {
			hasSelectedBlocks: !! _selectedBlockClientIds.length,
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			isPublishSidebarOpened:
				select( editPostStore ).isPublishSidebarOpened(),
			isSaving: select( editPostStore ).isSavingMetaBoxes(),
			showIconLabels:
				select( editPostStore ).isFeatureActive( 'showIconLabels' ),
			isDistractionFreeMode:
				select( editPostStore ).isFeatureActive( 'distractionFree' ),
			hasFixedToolbar: settings.hasFixedToolbar,
			isNavigationMode: _isNavigationMode(),
		};
	} );

	const {} = useSelect( blockEditorStore );

	const isDistractionFree = isDistractionFreeMode && isLargeViewport;

	const [ headerToolbar, setHeaderToolbar ] = useState( 'document' );

	useEffect( () => {
		if ( isNavigationMode ) {
			setHeaderToolbar( 'document' );
		} else if ( hasSelectedBlocks ) {
			setHeaderToolbar( 'block' );
		} else {
			setHeaderToolbar( 'document' );
		}
	}, [ hasSelectedBlocks, isNavigationMode ] );

	const slideY = {
		hidden: isDistractionFree ? { y: '-50' } : { y: 0 },
		hover: { y: 0, transition: { type: 'tween', delay: 0.2 } },
	};

	const slideX = {
		hidden: isDistractionFree ? { x: '-100%' } : { x: 0 },
		hover: { x: 0, transition: { type: 'tween', delay: 0.2 } },
	};

	const blockToolbarAriaLabel = __( 'Block tools' );

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
				{ ( ! hasFixedToolbar || isNavigationMode ) && (
					<HeaderToolbar />
				) }
				{ hasFixedToolbar && ! isNavigationMode && (
					<>
						<MaybeHide isHidden={ headerToolbar === 'block' }>
							<HeaderToolbar
								hasSelectedBlocks={ hasSelectedBlocks }
								BlockToolbarToggle={ () => (
									<ShowBlockToolbarButton
										onClick={ () =>
											setHeaderToolbar( 'block' )
										}
									/>
								) }
							/>
						</MaybeHide>
						<MaybeHide isHidden={ headerToolbar === 'document' }>
							<NavigableToolbar
								className="edit-post-header-block-toolbar"
								aria-label={ blockToolbarAriaLabel }
							>
								<InserterButton />
								<ShowDocumentToolbarButton
									onClick={ () =>
										setHeaderToolbar( 'document' )
									}
								/>
								<BlockToolbar
									hideDragHandle={ hasFixedToolbar }
								/>
							</NavigableToolbar>
						</MaybeHide>
					</>
				) }
				<TemplateTitle />
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
