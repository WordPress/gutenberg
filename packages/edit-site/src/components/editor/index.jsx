import { useDispatch, useSelect } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import {
	privateApis as editorPrivateApis,
	store as editorStore,
} from '@wordpress/editor';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';
import { useCallback, useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { decodeEntities } from '@wordpress/html-entities';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';
import { store as preferencesStore } from '@wordpress/preferences';
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
import { getDeviceType } from '../block-editor/viewport';
import useEditorTitle from './use-editor-title';
import useRevisionsURLSync from './use-revisions-url-sync';
import { useIsSiteEditorLoading } from '../layout/hooks';
import { useAdaptEditorToCanvas } from './use-adapt-editor-to-canvas';
import {
	useResolveEditedEntity,
	useSyncDeprecatedEntityIntoState,
} from './use-resolve-edited-entity';
import SitePreview from './site-preview';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

const { Editor, BackButton } = unlock( editorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );

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

function getNavigationPath( location, postType, showStylebook ) {
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
	// Keep the style book open when leaving the editor on the styles route.
	return addQueryArgs( path, {
		canvas: undefined,
		revision: undefined,
		preview: name === 'styles' && showStylebook ? 'stylebook' : undefined,
	} );
}

export default function EditSiteEditor( {
	isHomeRoute = false,
	// Routes that stand for the whole site pass 'template-locked', so the
	// canvas shows the template around whatever it is rendering, and the
	// controls for switching it are not offered.
	renderingMode,
} ) {
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
	const showIconLabels = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', 'showIconLabels' ),
		[]
	);
	const postWithTemplate = !! context?.postId;
	/*
	 * A template can name the template it is rendered inside, so the canvas has
	 * one to show around it the way a page does. A template that names none
	 * stands for itself, which is what it names as its own template, so that
	 * the editor can tell it apart from a template still being resolved.
	 */
	const parentTemplateId = useSelect(
		( select ) => {
			if ( postWithTemplate || postType !== TEMPLATE_POST_TYPE ) {
				return undefined;
			}
			/*
			 * The `template` field is only in the REST response while the
			 * templates inside templates experiment is on. Without it a
			 * template names no template at all, as it did before the
			 * experiment, so the editor and what it reports as the current
			 * template are left as they were.
			 */
			const record = select( coreDataStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			);
			if ( record && ! Object.hasOwn( record, 'template' ) ) {
				return undefined;
			}
			const templateId = unlock( select( coreDataStore ) ).getTemplateId(
				postType,
				postId
			);

			if ( templateId === undefined ) {
				return undefined;
			}

			return templateId ?? postId;
		},
		[ postWithTemplate, postType, postId ]
	);
	const editorPostType = postWithTemplate ? context.postType : postType;
	const editorPostId = postWithTemplate ? context.postId : postId;
	useEditorTitle( editorPostType, editorPostId );
	const _isPreviewingTheme = isPreviewingTheme();
	const iframeProps = useEditorIframeProps();
	const isEditMode = canvas === 'edit';
	useRevisionsURLSync( isEditMode, editorPostType, editorPostId );
	const loadingProgressId = useInstanceId(
		CanvasLoader,
		'edit-site-editor__loading-progress'
	);

	const editorSettings = useSpecificEditorSettings();
	const { resetZoomLevel } = unlock( useDispatch( blockEditorStore ) );
	const { setCurrentRevisionId, resetStylesNavigation } = unlock(
		useDispatch( editorStore )
	);
	const { getShowStylebook } = unlock( useSelect( editorStore ) );

	// Revisions and the style book render in place of the block editor, and
	// belong to the styles route in edit mode. Anywhere else they would show
	// the styles canvas where the block editor is expected: a site preview
	// that cannot be clicked into, or the next route's content missing.
	//
	// Routes render their own element for this area, so navigating between
	// them remounts this component. The check therefore runs on every render
	// rather than on a transition, which a remount would never observe.
	const isStylesEditing = isEditMode && location.name === 'styles';
	useEffect( () => {
		if ( ! isStylesEditing ) {
			resetStylesNavigation();
		}
	}, [ isStylesEditing, resetStylesNavigation ] );

	const { createSuccessNotice } = useDispatch( noticesStore );
	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'move-to-trash':
				case 'permanently-delete':
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
					templateId={ postWithTemplate ? postId : parentTemplateId }
					settings={ editorSettings }
					renderingMode={ renderingMode }
					className="edit-site-editor__editor-interface"
					customSaveButton={
						_isPreviewingTheme && <SaveButton size="compact" />
					}
					customSavePanel={ _isPreviewingTheme && <SavePanel /> }
					iframeProps={ iframeProps }
					onActionPerformed={ onActionPerformed }
					initialViewport={
						isEditMode
							? getDeviceType( location.query.viewport )
							: undefined
					}
					extraSidebarPanels={
						! postWithTemplate && (
							<PluginTemplateSettingPanel.Slot />
						)
					}
				>
					{ isEditMode && (
						<BackButton>
							{ ( { length } ) =>
								length <= 1 && (
									<Button
										size="compact"
										label={ __( 'Open Navigation' ) }
										showTooltip={ ! showIconLabels }
										tooltipPosition="middle right"
										onClick={ () => {
											resetZoomLevel();
											setCurrentRevisionId( null );
											history.navigate(
												getNavigationPath(
													location,
													postWithTemplate
														? context.postType
														: postType,
													getShowStylebook()
												),
												{
													transition:
														'canvas-mode-view-transition',
												}
											);
										} }
										icon={
											isRTL() ? chevronRight : chevronLeft
										}
									/>
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
