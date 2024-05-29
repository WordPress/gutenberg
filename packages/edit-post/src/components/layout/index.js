/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AutosaveMonitor,
	LocalAutosaveMonitor,
	UnsavedChangesWarning,
	EditorNotices,
	EditorKeyboardShortcutsRegister,
	EditorSnackbars,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockBreadcrumb,
	BlockToolbar,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { PluginArea } from '@wordpress/plugins';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
import { privateApis as coreCommandsPrivateApis } from '@wordpress/core-commands';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import VisualEditor from '../visual-editor';
import EditPostKeyboardShortcuts from '../keyboard-shortcuts';
import InitPatternModal from '../init-pattern-modal';
import BrowserURL from '../browser-url';
import Header from '../header';
import MetaBoxes from '../meta-boxes';
import WelcomeGuide from '../welcome-guide';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';
import useCommonCommands from '../../hooks/commands/use-common-commands';

const { getLayoutStyles } = unlock( blockEditorPrivateApis );
const { useCommands } = unlock( coreCommandsPrivateApis );
const { useCommandContext } = unlock( commandsPrivateApis );
const {
	InserterSidebar,
	ListViewSidebar,
	ComplementaryArea,
	FullscreenMode,
	SavePublishPanels,
	InterfaceSkeleton,
	interfaceStore,
	Sidebar,
	TextEditor,
} = unlock( editorPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

const interfaceLabels = {
	/* translators: accessibility text for the editor top bar landmark region. */
	header: __( 'Editor top bar' ),
	/* translators: accessibility text for the editor content landmark region. */
	body: __( 'Editor content' ),
	/* translators: accessibility text for the editor settings landmark region. */
	sidebar: __( 'Editor settings' ),
	/* translators: accessibility text for the editor publish landmark region. */
	actions: __( 'Editor publish' ),
	/* translators: accessibility text for the editor footer landmark region. */
	footer: __( 'Editor footer' ),
};

function useEditorStyles() {
	const { hasThemeStyleSupport, editorSettings } = useSelect(
		( select ) => ( {
			hasThemeStyleSupport:
				select( editPostStore ).isFeatureActive( 'themeStyles' ),
			editorSettings: select( editorStore ).getEditorSettings(),
		} ),
		[]
	);

	// Compute the default styles.
	return useMemo( () => {
		const presetStyles =
			editorSettings.styles?.filter(
				( style ) =>
					style.__unstableType && style.__unstableType !== 'theme'
			) ?? [];

		const defaultEditorStyles = [
			...editorSettings.defaultEditorStyles,
			...presetStyles,
		];

		// Has theme styles if the theme supports them and if some styles were not preset styles (in which case they're theme styles).
		const hasThemeStyles =
			hasThemeStyleSupport &&
			presetStyles.length !== ( editorSettings.styles?.length ?? 0 );

		// If theme styles are not present or displayed, ensure that
		// base layout styles are still present in the editor.
		if ( ! editorSettings.disableLayoutStyles && ! hasThemeStyles ) {
			defaultEditorStyles.push( {
				css: getLayoutStyles( {
					style: {},
					selector: 'body',
					hasBlockGapSupport: false,
					hasFallbackGapSupport: true,
					fallbackGapValue: '0.5em',
				} ),
			} );
		}

		return hasThemeStyles ? editorSettings.styles : defaultEditorStyles;
	}, [
		editorSettings.defaultEditorStyles,
		editorSettings.disableLayoutStyles,
		editorSettings.styles,
		hasThemeStyleSupport,
	] );
}

function Layout( { initialPost } ) {
	useCommands();
	useCommonCommands();

	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isWideViewport = useViewportMatch( 'large' );
	const isLargeViewport = useViewportMatch( 'medium' );

	const { closeGeneralSidebar } = useDispatch( editPostStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const {
		mode,
		isFullscreenActive,
		isRichEditingEnabled,
		sidebarIsOpened,
		hasActiveMetaboxes,
		previousShortcut,
		nextShortcut,
		hasBlockSelected,
		isInserterOpened,
		isListViewOpened,
		showIconLabels,
		isDistractionFree,
		showBlockBreadcrumbs,
		showMetaBoxes,
		documentLabel,
		hasHistory,
		hasBlockBreadcrumbs,
		blockEditorMode,
		isEditingTemplate,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { getEditorSettings, getPostTypeLabel } = select( editorStore );
		const editorSettings = getEditorSettings();
		const postTypeLabel = getPostTypeLabel();

		return {
			showMetaBoxes:
				select( editorStore ).getRenderingMode() === 'post-only',
			sidebarIsOpened: !! (
				select( interfaceStore ).getActiveComplementaryArea( 'core' ) ||
				select( editorStore ).isPublishSidebarOpened()
			),
			isFullscreenActive:
				select( editPostStore ).isFeatureActive( 'fullscreenMode' ),
			isInserterOpened: select( editorStore ).isInserterOpened(),
			isListViewOpened: select( editorStore ).isListViewOpened(),
			mode: select( editorStore ).getEditorMode(),
			isRichEditingEnabled: editorSettings.richEditingEnabled,
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			previousShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/editor/previous-region' ),
			nextShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/editor/next-region' ),
			showIconLabels: get( 'core', 'showIconLabels' ),
			isDistractionFree: get( 'core', 'distractionFree' ),
			showBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
			// translators: Default label for the Document in the Block Breadcrumb.
			documentLabel: postTypeLabel || _x( 'Document', 'noun' ),
			hasBlockSelected:
				!! select( blockEditorStore ).getBlockSelectionStart(),
			hasHistory: !! getEditorSettings().onNavigateToPreviousEntityRecord,
			hasBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
			blockEditorMode:
				select( blockEditorStore ).__unstableGetEditorMode(),
			isEditingTemplate:
				select( editorStore ).getCurrentPostType() === 'wp_template',
		};
	}, [] );

	// Set the right context for the command palette
	const commandContext = hasBlockSelected
		? 'block-selection-edit'
		: 'entity-edit';
	useCommandContext( commandContext );

	const styles = useEditorStyles();

	// Local state for save panel.
	// Note 'truthy' callback implies an open panel.
	const [ entitiesSavedStatesCallback, setEntitiesSavedStatesCallback ] =
		useState( false );

	const closeEntitiesSavedStates = useCallback(
		( arg ) => {
			if ( typeof entitiesSavedStatesCallback === 'function' ) {
				entitiesSavedStatesCallback( arg );
			}
			setEntitiesSavedStatesCallback( false );
		},
		[ entitiesSavedStatesCallback ]
	);

	// We need to add the show-icon-labels class to the body element so it is applied to modals.
	if ( showIconLabels ) {
		document.body.classList.add( 'show-icon-labels' );
	} else {
		document.body.classList.remove( 'show-icon-labels' );
	}

	const className = clsx( 'edit-post-layout', 'is-mode-' + mode, {
		'is-sidebar-opened': sidebarIsOpened,
		'has-metaboxes': hasActiveMetaboxes,
		'is-distraction-free': isDistractionFree && isWideViewport,
		'is-entity-save-view-open': !! entitiesSavedStatesCallback,
		'has-block-breadcrumbs':
			hasBlockBreadcrumbs && ! isDistractionFree && isWideViewport,
	} );

	const secondarySidebarLabel = isListViewOpened
		? __( 'Document Overview' )
		: __( 'Block Library' );

	const secondarySidebar = () => {
		if ( mode === 'visual' && isInserterOpened ) {
			return (
				<InserterSidebar
					closeGeneralSidebar={ closeGeneralSidebar }
					isRightSidebarOpen={ sidebarIsOpened }
				/>
			);
		}
		if ( mode === 'visual' && isListViewOpened ) {
			return <ListViewSidebar />;
		}

		return null;
	};

	function onPluginAreaError( name ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: plugin name */
				__(
					'The "%s" plugin has encountered an error and cannot be rendered.'
				),
				name
			)
		);
	}

	const { createSuccessNotice } = useDispatch( noticesStore );

	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'move-to-trash':
					{
						document.location.href = addQueryArgs( 'edit.php', {
							trashed: 1,
							post_type: items[ 0 ].type,
							ids: items[ 0 ].id,
						} );
					}
					break;
				case 'duplicate-post':
					{
						const newItem = items[ 0 ];
						const title =
							typeof newItem.title === 'string'
								? newItem.title
								: newItem.title?.rendered;
						createSuccessNotice(
							sprintf(
								// translators: %s: Title of the created post e.g: "Post 1".
								__( '"%s" successfully created.' ),
								title
							),
							{
								type: 'snackbar',
								id: 'duplicate-post-action',
								actions: [
									{
										label: __( 'Edit' ),
										onClick: () => {
											const postId = newItem.id;
											document.location.href =
												addQueryArgs( 'post.php', {
													post: postId,
													action: 'edit',
												} );
										},
									},
								],
							}
						);
					}
					break;
			}
		},
		[ createSuccessNotice ]
	);

	return (
		<>
			<FullscreenMode isActive={ isFullscreenActive } />
			<BrowserURL hasHistory={ hasHistory } />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<LocalAutosaveMonitor />
			<EditPostKeyboardShortcuts />
			<EditorKeyboardShortcutsRegister />
			<BlockKeyboardShortcuts />

			<InterfaceSkeleton
				isDistractionFree={ isDistractionFree && isWideViewport }
				className={ className }
				labels={ {
					...interfaceLabels,
					secondarySidebar: secondarySidebarLabel,
				} }
				header={
					<Header
						setEntitiesSavedStatesCallback={
							setEntitiesSavedStatesCallback
						}
						initialPost={ initialPost }
					/>
				}
				editorNotices={ <EditorNotices /> }
				secondarySidebar={ secondarySidebar() }
				sidebar={
					! isDistractionFree && (
						<ComplementaryArea.Slot scope="core" />
					)
				}
				notices={ <EditorSnackbars /> }
				content={
					<>
						{ ! isDistractionFree && <EditorNotices /> }
						{ ( mode === 'text' || ! isRichEditingEnabled ) && (
							<TextEditor />
						) }
						{ ! isLargeViewport && mode === 'visual' && (
							<BlockToolbar hideDragHandle />
						) }
						{ isRichEditingEnabled && mode === 'visual' && (
							<VisualEditor styles={ styles } />
						) }
						{ ! isDistractionFree && showMetaBoxes && (
							<div className="edit-post-layout__metaboxes">
								<MetaBoxes location="normal" />
								<MetaBoxes location="advanced" />
							</div>
						) }
					</>
				}
				footer={
					! isDistractionFree &&
					! isMobileViewport &&
					showBlockBreadcrumbs &&
					isRichEditingEnabled &&
					blockEditorMode !== 'zoom-out' &&
					mode === 'visual' && (
						<div className="edit-post-layout__footer">
							<BlockBreadcrumb rootLabelText={ documentLabel } />
						</div>
					)
				}
				actions={
					<SavePublishPanels
						closeEntitiesSavedStates={ closeEntitiesSavedStates }
						isEntitiesSavedStatesOpen={
							entitiesSavedStatesCallback
						}
						setEntitiesSavedStatesCallback={
							setEntitiesSavedStatesCallback
						}
						forceIsDirtyPublishPanel={ hasActiveMetaboxes }
					/>
				}
				shortcuts={ {
					previous: previousShortcut,
					next: nextShortcut,
				} }
			/>
			<WelcomeGuide />
			<InitPatternModal />
			<PluginArea onError={ onPluginAreaError } />
			{ ! isDistractionFree && (
				<Sidebar
					onActionPerformed={ onActionPerformed }
					extraPanels={
						! isEditingTemplate && <MetaBoxes location="side" />
					}
				/>
			) }
		</>
	);
}

export default Layout;
