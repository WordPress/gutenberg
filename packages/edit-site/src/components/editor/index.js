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
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { useCallback } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { decodeEntities } from '@wordpress/html-entities';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import WelcomeGuide from '../welcome-guide';
import CanvasLoader from '../canvas-loader';
import { unlock } from '../../lock-unlock';
import { useSpecificEditorSettings } from '../block-editor/use-site-editor-settings';
import PluginTemplateSettingPanel from '../plugin-template-setting-panel';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';
import SaveButton from '../save-button';
import SavePanel from '../save-panel';
import SiteEditorMoreMenu from '../more-menu';
import useEditorIframeProps from '../block-editor/use-editor-iframe-props';
import { ViewportSync } from '../block-editor/use-viewport-sync';
import useEditorTitle from './use-editor-title';
import { useIsSiteEditorLoading } from '../layout/hooks';
import { useAdaptEditorToCanvas } from './use-adapt-editor-to-canvas';
import {
	useResolveEditedEntity,
	useSyncDeprecatedEntityIntoState,
} from './use-resolve-edited-entity';
import SitePreview from './site-preview';

const { Editor, BackButton } = unlock( editorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

function getListPathForPostType( postType ) {
	switch ( postType ) {
		case 'navigation':
			return '/navigation';
		case 'wp_block':
			return '/pattern?postType=wp_block';
		case 'wp_template_part':
			return '/pattern?postType=wp_template_part';
		case 'wp_template':
			return '/template';
		case 'page':
			return '/page';
		case 'post':
			return '/';
	}
	throw 'Unknown post type';
}

function getNavigationPath( location, postType ) {
	const { path, name } = location;
	if (
		[
			'pattern-item',
			'template-part-item',
			'page-item',
			'template-item',
			'static-template-item',
			'post-item',
		].includes( name )
	) {
		return getListPathForPostType( postType );
	}
	return addQueryArgs( path, { canvas: undefined } );
}

export default function EditSiteEditor( { isHomeRoute = false } ) {
	const location = useLocation();
	const history = useHistory();
	const { canvas = 'view' } = location.query;
	const isLoading = useIsSiteEditorLoading();
	useAdaptEditorToCanvas( canvas );
	const entity = useResolveEditedEntity();
	// deprecated sync state with url
	useSyncDeprecatedEntityIntoState( entity );
	const { postType, postId, context } = entity;
	const isBlockBasedTheme = useSelect(
		( select ) => select( coreDataStore ).getCurrentTheme()?.is_block_theme,
		[]
	);
	const postWithTemplate = !! context?.postId;
	useEditorTitle(
		postWithTemplate ? context.postType : postType,
		postWithTemplate ? context.postId : postId
	);
	const _isPreviewingTheme = isPreviewingTheme();
	const iframeProps = useEditorIframeProps();
	const isEditMode = canvas === 'edit';
	const loadingProgressId = useInstanceId(
		CanvasLoader,
		'edit-site-editor__loading-progress'
	);

	const editorSettings = useSpecificEditorSettings();
	const { resetZoomLevel } = unlock( useDispatch( blockEditorStore ) );
	const { setCurrentRevisionId } = unlock( useDispatch( editorStore ) );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'move-to-trash':
				case 'delete-post':
					{
						history.navigate(
							getListPathForPostType(
								postWithTemplate ? context.postType : postType
							)
						);
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
								// translators: %s: Title of the created post or template, e.g: "Hello world".
								__( '"%s" successfully created.' ),
								decodeEntities( _title ) || __( '(no title)' )
							),
							{
								type: 'snackbar',
								id: 'duplicate-post-action',
								actions: [
									{
										label: __( 'Edit' ),
										onClick: () => {
											history.navigate(
												`/${ newItem.type }/${ newItem.id }?canvas=edit`
											);
										},
									},
								],
							}
						);
					}
					break;
			}
		},
		[
			postType,
			context?.postType,
			postWithTemplate,
			history,
			createSuccessNotice,
		]
	);

	const isReady = ! isLoading;

	return ! isBlockBasedTheme && isHomeRoute ? (
		<SitePreview />
	) : (
		<>
			<EditorKeyboardShortcutsRegister />
			{ isEditMode && <BlockKeyboardShortcuts /> }
			{ ! isReady ? <CanvasLoader id={ loadingProgressId } /> : null }
			{ isEditMode && isReady && (
				<WelcomeGuide
					postType={ postWithTemplate ? context.postType : postType }
				/>
			) }
			{ isReady && (
				<Editor
					postType={ postWithTemplate ? context.postType : postType }
					postId={ postWithTemplate ? context.postId : postId }
					templateId={ postWithTemplate ? postId : undefined }
					settings={ editorSettings }
					className="edit-site-editor__editor-interface"
					customSaveButton={
						_isPreviewingTheme && <SaveButton size="compact" />
					}
					customSavePanel={ _isPreviewingTheme && <SavePanel /> }
					iframeProps={ iframeProps }
					onActionPerformed={ onActionPerformed }
					extraSidebarPanels={
						! postWithTemplate && (
							<PluginTemplateSettingPanel.Slot />
						)
					}
				>
					{ isEditMode && <ViewportSync /> }
					{ isEditMode && (
						<BackButton>
							{ ( { length } ) =>
								length <= 1 && (
									<div className="edit-site-editor__view-mode-toggle">
										<Button
											__next40pxDefaultSize
											label={ __( 'Open Navigation' ) }
											showTooltip
											tooltipPosition="middle right"
											onClick={ () => {
												resetZoomLevel();
												setCurrentRevisionId( null );
												history.navigate(
													getNavigationPath(
														location,
														postWithTemplate
															? context.postType
															: postType
													),
													{
														transition:
															'canvas-mode-view-transition',
													}
												);
											} }
										/>
										<div className="edit-site-editor__back-icon">
											<Icon
												icon={
													isRTL()
														? chevronRight
														: chevronLeft
												}
											/>
										</div>
									</div>
								)
							}
						</BackButton>
					) }
					<SiteEditorMoreMenu />
				</Editor>
			) }
		</>
	);
}
