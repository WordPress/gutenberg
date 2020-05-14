/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	LocalAutosaveMonitor,
	EditorKeyboardShortcutsRegister,
} from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import {
	ScrollLock,
	Popover,
	FocusReturnProvider,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	ComplementaryArea,
	FullscreenMode,
	InterfaceSkeleton,
} from '@wordpress/interface';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import VisualEditor from '../visual-editor';
import EditPostKeyboardShortcuts from '../keyboard-shortcuts';
import BrowserURL from '../browser-url';
import Header from '../header';
import SettingsSidebar from '../sidebar/settings-sidebar';
import ActionsPanel from './actions-panel';

const interfaceLabels = {
	leftSidebar: __( 'Block Library' ),
};

function Layout() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const {
		mode,
		editorSidebarOpened,
		pluginSidebarOpened,
		publishSidebarOpened,
		hasActiveMetaboxes,
		hasFixedToolbar,
		previousShortcut,
		nextShortcut,
	} = useSelect( ( select ) => {
		return {
			hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive(
				'fixedToolbar'
			),
			editorSidebarOpened: select(
				'core/edit-post'
			).isEditorSidebarOpened(),
			pluginSidebarOpened: select(
				'core/edit-post'
			).isPluginSidebarOpened(),
			publishSidebarOpened: select(
				'core/edit-post'
			).isPublishSidebarOpened(),
			mode: select( 'core/edit-post' ).getEditorMode(),
			hasActiveMetaboxes: select( 'core/edit-post' ).hasMetaBoxes(),
			previousShortcut: select(
				'core/keyboard-shortcuts'
			).getAllShortcutRawKeyCombinations(
				'core/edit-post/previous-region'
			),
			nextShortcut: select(
				'core/keyboard-shortcuts'
			).getAllShortcutRawKeyCombinations( 'core/edit-post/next-region' ),
		};
	}, [] );
	const sidebarIsOpened =
		editorSidebarOpened || pluginSidebarOpened || publishSidebarOpened;
	const className = classnames( 'edit-post-layout', 'is-mode-' + mode, {
		'is-sidebar-opened': sidebarIsOpened,
		'has-fixed-toolbar': hasFixedToolbar,
		'has-metaboxes': hasActiveMetaboxes,
	} );

	// Local state for save panel.
	// Note 'thruthy' callback implies an open panel.
	const [
		entitiesSavedStatesCallback,
		setEntitiesSavedStatesCallback,
	] = useState( false );
	const closeEntitiesSavedStates = useCallback(
		( arg ) => {
			if ( typeof entitiesSavedStatesCallback === 'function' ) {
				entitiesSavedStatesCallback( arg );
			}
			setEntitiesSavedStatesCallback( false );
		},
		[ entitiesSavedStatesCallback ]
	);

	return (
		<>
			<FullscreenMode isActive={ true } />
			<BrowserURL />
			<LocalAutosaveMonitor />
			<EditPostKeyboardShortcuts />
			<EditorKeyboardShortcutsRegister />
			<FocusReturnProvider>
				<InterfaceSkeleton
					className={ className }
					labels={ interfaceLabels }
					header={
						<Header
							isInserterOpen={ false }
							setEntitiesSavedStatesCallback={
								setEntitiesSavedStatesCallback
							}
						/>
					}
					sidebar={
						sidebarIsOpened && (
							<>
								<SettingsSidebar />
								<ComplementaryArea.Slot scope="core/edit-post" />
							</>
						)
					}
					content={
						<>
							<VisualEditor />
							{ isMobileViewport && sidebarIsOpened && (
								<ScrollLock />
							) }
						</>
					}
					actions={
						<ActionsPanel
							closeEntitiesSavedStates={
								closeEntitiesSavedStates
							}
							isEntitiesSavedStatesOpen={
								entitiesSavedStatesCallback
							}
							setEntitiesSavedStatesCallback={
								setEntitiesSavedStatesCallback
							}
						/>
					}
					shortcuts={ {
						previous: previousShortcut,
						next: nextShortcut,
					} }
				/>
				<Popover.Slot />
			</FocusReturnProvider>
		</>
	);
}

export default Layout;
