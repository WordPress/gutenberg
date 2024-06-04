/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Notice } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	EditorKeyboardShortcutsRegister,
	privateApis as editorPrivateApis,
	store as editorStore,
} from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { useCallback, useMemo } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import WelcomeGuide from '../welcome-guide';
import { store as editSiteStore } from '../../store';
import { GlobalStylesRenderer } from '../global-styles-renderer';
import useTitle from '../routes/use-title';
import CanvasLoader from '../canvas-loader';
import { unlock } from '../../lock-unlock';
import useEditedEntityRecord from '../use-edited-entity-record';
import { POST_TYPE_LABELS, TEMPLATE_POST_TYPE } from '../../utils/constants';
import TemplatePartConverter from '../template-part-converter';
import { useSpecificEditorSettings } from '../block-editor/use-site-editor-settings';
import PluginTemplateSettingPanel from '../plugin-template-setting-panel';
import GlobalStylesSidebar from '../global-styles-sidebar';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';
import {
	getEditorCanvasContainerTitle,
	useHasEditorCanvasContainer,
} from '../editor-canvas-container';
import SaveButton from '../save-button';
import SiteEditorMoreMenu from '../more-menu';
import useEditorIframeProps from '../block-editor/use-editor-iframe-props';

const {
	EditorInterface,
	ExperimentalEditorProvider: EditorProvider,
	Sidebar,
} = unlock( editorPrivateApis );
const { useHistory } = unlock( routerPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

export default function Editor( { isLoading } ) {
	const {
		record: editedPost,
		getTitle,
		isLoaded: hasLoadedPost,
	} = useEditedEntityRecord();
	const { type: editedPostType } = editedPost;
	const {
		context,
		contextPost,
		editorMode,
		canvasMode,
		isEditingPage,
		supportsGlobalStyles,
		showIconLabels,
		editorCanvasView,
		currentPostIsTrashed,
	} = useSelect( ( select ) => {
		const { getEditedPostContext, getCanvasMode, isPage } = unlock(
			select( editSiteStore )
		);
		const { get } = select( preferencesStore );
		const { getEntityRecord, getCurrentTheme } = select( coreDataStore );
		const { getEditorMode } = select( editorStore );
		const _context = getEditedPostContext();

		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			context: _context,
			contextPost: _context?.postId
				? getEntityRecord(
						'postType',
						_context.postType,
						_context.postId
				  )
				: undefined,
			editorMode: getEditorMode(),
			canvasMode: getCanvasMode(),
			isEditingPage: isPage(),
			supportsGlobalStyles: getCurrentTheme()?.is_block_theme,
			showIconLabels: get( 'core', 'showIconLabels' ),
			editorCanvasView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			currentPostIsTrashed:
				select( editorStore ).getCurrentPostAttribute( 'status' ) ===
				'trash',
		};
	}, [] );
	const _isPreviewingTheme = isPreviewingTheme();
	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();
	const iframeProps = useEditorIframeProps();

	const isViewMode = canvasMode === 'view';
	const isEditMode = canvasMode === 'edit';
	const showVisualEditor = isViewMode || editorMode === 'visual';
	const postWithTemplate = !! context?.postId;

	let title;
	if ( hasLoadedPost ) {
		title = sprintf(
			// translators: A breadcrumb trail for the Admin document title. %1$s: title of template being edited, %2$s: type of template (Template or Template Part).
			__( '%1$s ‹ %2$s' ),
			getTitle(),
			POST_TYPE_LABELS[ editedPostType ] ??
				POST_TYPE_LABELS[ TEMPLATE_POST_TYPE ]
		);
	}

	// Only announce the title once the editor is ready to prevent "Replace"
	// action in <URLQueryController> from double-announcing.
	useTitle( hasLoadedPost && title );

	const loadingProgressId = useInstanceId(
		CanvasLoader,
		'edit-site-editor__loading-progress'
	);

	const settings = useSpecificEditorSettings();
	const styles = useMemo(
		() => [
			...settings.styles,
			{
				// Forming a "block formatting context" to prevent margin collapsing.
				// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context

				css: `body{${
					canvasMode === 'view'
						? `min-height: 100vh; ${
								currentPostIsTrashed ? '' : 'cursor: pointer;'
						  }`
						: ''
				}}}`,
			},
		],
		[ settings.styles, canvasMode, currentPostIsTrashed ]
	);
	const { createSuccessNotice } = useDispatch( noticesStore );
	const history = useHistory();
	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'move-to-trash':
				case 'delete-post':
					{
						history.push( {
							postType: items[ 0 ].type,
						} );
					}
					break;
				case 'duplicate-post':
					{
						const newItem = items[ 0 ];
						const _title =
							typeof newItem.title === 'string'
								? newItem.title
								: newItem.title?.rendered;
						createSuccessNotice(
							sprintf(
								// translators: %s: Title of the created post e.g: "Post 1".
								__( '"%s" successfully created.' ),
								_title
							),
							{
								type: 'snackbar',
								id: 'duplicate-post-action',
								actions: [
									{
										label: __( 'Edit' ),
										onClick: () => {
											history.push( {
												postId: newItem.id,
												postType: newItem.type,
												canvas: 'edit',
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
		[ history, createSuccessNotice ]
	);

	const isReady =
		! isLoading &&
		( ( postWithTemplate && !! contextPost && !! editedPost ) ||
			( ! postWithTemplate && !! editedPost ) );

	return (
		<>
			<GlobalStylesRenderer />
			<EditorKeyboardShortcutsRegister />
			{ isEditMode && <BlockKeyboardShortcuts /> }
			{ showVisualEditor && <TemplatePartConverter /> }
			{ ! isReady ? <CanvasLoader id={ loadingProgressId } /> : null }
			{ isEditMode && <WelcomeGuide /> }
			{ hasLoadedPost && ! editedPost && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						"You attempted to edit an item that doesn't exist. Perhaps it was deleted?"
					) }
				</Notice>
			) }
			{ isReady && (
				<EditorProvider
					post={ postWithTemplate ? contextPost : editedPost }
					__unstableTemplate={
						postWithTemplate ? editedPost : undefined
					}
					settings={ settings }
					useSubRegistry={ false }
				>
					<SiteEditorMoreMenu />
					<EditorInterface
						className={ clsx(
							'edit-site-editor__interface-skeleton',
							{
								'show-icon-labels': showIconLabels,
							}
						) }
						styles={ styles }
						enableRegionNavigation={ false }
						customSaveButton={
							_isPreviewingTheme && <SaveButton size="compact" />
						}
						forceDisableBlockTools={ ! hasDefaultEditorCanvasView }
						title={
							! hasDefaultEditorCanvasView
								? getEditorCanvasContainerTitle(
										editorCanvasView
								  )
								: undefined
						}
						iframeProps={ iframeProps }
					/>
					<Sidebar
						onActionPerformed={ onActionPerformed }
						extraPanels={
							! isEditingPage && (
								<PluginTemplateSettingPanel.Slot />
							)
						}
					/>
					{ supportsGlobalStyles && <GlobalStylesSidebar /> }
				</EditorProvider>
			) }
		</>
	);
}
