/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
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
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import WelcomeGuide from '../welcome-guide';
import { store as editSiteStore } from '../../store';
import { GlobalStylesRenderer } from '../global-styles-renderer';
import CanvasLoader from '../canvas-loader';
import { unlock } from '../../lock-unlock';
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
import SiteIcon from '../site-icon';
import useEditorIframeProps from '../block-editor/use-editor-iframe-props';
import useEditorTitle from './use-editor-title';

const { Editor, BackButton } = unlock( editorPrivateApis );
const { useHistory } = unlock( routerPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

export default function EditSiteEditor( { isLoading } ) {
	const {
		editedPostType,
		editedPostId,
		contextPostType,
		contextPostId,
		canvasMode,
		isEditingPage,
		supportsGlobalStyles,
		showIconLabels,
		editorCanvasView,
		currentPostIsTrashed,
	} = useSelect( ( select ) => {
		const {
			getEditedPostContext,
			getCanvasMode,
			isPage,
			getEditedPostType,
			getEditedPostId,
		} = unlock( select( editSiteStore ) );
		const { get } = select( preferencesStore );
		const { getCurrentTheme } = select( coreDataStore );
		const _context = getEditedPostContext();

		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			editedPostType: getEditedPostType(),
			editedPostId: getEditedPostId(),
			contextPostType: _context?.postId ? _context.postType : undefined,
			contextPostId: _context?.postId ? _context.postId : undefined,
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
	useEditorTitle();
	const _isPreviewingTheme = isPreviewingTheme();
	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();
	const iframeProps = useEditorIframeProps();
	const isEditMode = canvasMode === 'edit';
	const postWithTemplate = !! contextPostId;
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
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
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
								decodeEntities( _title )
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

	const isReady = ! isLoading;

	return (
		<>
			<GlobalStylesRenderer />
			<EditorKeyboardShortcutsRegister />
			{ isEditMode && <BlockKeyboardShortcuts /> }
			{ ! isReady ? <CanvasLoader id={ loadingProgressId } /> : null }
			{ isEditMode && <WelcomeGuide /> }
			{ isReady && (
				<Editor
					postType={
						postWithTemplate ? contextPostType : editedPostType
					}
					postId={ postWithTemplate ? contextPostId : editedPostId }
					templateId={ postWithTemplate ? editedPostId : undefined }
					settings={ settings }
					className={ clsx( 'edit-site-editor__editor-interface', {
						'show-icon-labels': showIconLabels,
					} ) }
					styles={ styles }
					enableRegionNavigation={ false }
					customSaveButton={
						_isPreviewingTheme && <SaveButton size="compact" />
					}
					forceDisableBlockTools={ ! hasDefaultEditorCanvasView }
					title={
						! hasDefaultEditorCanvasView
							? getEditorCanvasContainerTitle( editorCanvasView )
							: undefined
					}
					iframeProps={ iframeProps }
					onActionPerformed={ onActionPerformed }
					extraSidebarPanels={
						! isEditingPage && <PluginTemplateSettingPanel.Slot />
					}
				>
					{ isEditMode && (
						<BackButton>
							{ ( { length } ) =>
								length <= 1 && (
									<Button
										label={ __( 'Open Navigation' ) }
										className="edit-site-layout__view-mode-toggle"
										onClick={ () =>
											setCanvasMode( 'view' )
										}
									>
										<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
									</Button>
								)
							}
						</BackButton>
					) }
					<SiteEditorMoreMenu />
					{ supportsGlobalStyles && <GlobalStylesSidebar /> }
				</Editor>
			) }
		</>
	);
}
