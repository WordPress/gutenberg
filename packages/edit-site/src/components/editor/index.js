/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, __unstableMotion as motion } from '@wordpress/components';
import { useInstanceId, useReducedMotion } from '@wordpress/compose';
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
import { decodeEntities } from '@wordpress/html-entities';
import { Icon, arrowUpLeft } from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';

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
import SavePanel from '../save-panel';
import SiteEditorMoreMenu from '../more-menu';
import SiteIcon from '../site-icon';
import useEditorIframeProps from '../block-editor/use-editor-iframe-props';
import useEditorTitle from './use-editor-title';
import { useIsSiteEditorLoading } from '../layout/hooks';
import { useAdaptEditorToCanvas } from './use-adapt-editor-to-canvas';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import {
	useResolveEditedEntity,
	useSyncDeprecatedEntityIntoState,
} from './use-resolve-edited-entity';
import SitePreview from './site-preview';

const { Editor, BackButton } = unlock( editorPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );

const toggleHomeIconVariants = {
	edit: {
		opacity: 0,
		scale: 0.2,
	},
	hover: {
		opacity: 1,
		scale: 1,
		clipPath: 'inset( 22% round 2px )',
	},
};

const siteIconVariants = {
	edit: {
		clipPath: 'inset(0% round 0px)',
	},
	hover: {
		clipPath: 'inset( 22% round 2px )',
	},
	tap: {
		clipPath: 'inset(0% round 0px)',
	},
};

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
			'post-item',
		].includes( name )
	) {
		return getListPathForPostType( postType );
	}
	return addQueryArgs( path, { canvas: undefined } );
}

export default function EditSiteEditor( {
	isHomeRoute = false,
	isPostsList = false,
} ) {
	const disableMotion = useReducedMotion();
	const location = useLocation();
	const { canvas = 'view' } = location.query;
	const isLoading = useIsSiteEditorLoading();
	useAdaptEditorToCanvas( canvas );
	const entity = useResolveEditedEntity();
	// deprecated sync state with url
	useSyncDeprecatedEntityIntoState( entity );
	const { postType, postId, context } = entity;
	const {
		isBlockBasedTheme,
		editorCanvasView,
		currentPostIsTrashed,
		hasSiteIcon,
	} = useSelect( ( select ) => {
		const { getEditorCanvasContainerView } = unlock(
			select( editSiteStore )
		);
		const { getCurrentTheme, getEntityRecord } = select( coreDataStore );
		const siteData = getEntityRecord( 'root', '__unstableBase', undefined );

		return {
			isBlockBasedTheme: getCurrentTheme()?.is_block_theme,
			editorCanvasView: getEditorCanvasContainerView(),
			currentPostIsTrashed:
				select( editorStore ).getCurrentPostAttribute( 'status' ) ===
				'trash',
			hasSiteIcon: !! siteData?.site_icon_url,
		};
	}, [] );
	const postWithTemplate = !! context?.postId;
	useEditorTitle(
		postWithTemplate ? context.postType : postType,
		postWithTemplate ? context.postId : postId
	);
	const _isPreviewingTheme = isPreviewingTheme();
	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();
	const iframeProps = useEditorIframeProps();
	const isEditMode = canvas === 'edit';
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
				css:
					canvas === 'view'
						? `body{min-height: 100vh; ${
								currentPostIsTrashed ? '' : 'cursor: pointer;'
						  }}`
						: undefined,
			},
		],
		[ settings.styles, canvas, currentPostIsTrashed ]
	);
	const { resetZoomLevel } = unlock( useDispatch( blockEditorStore ) );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const history = useHistory();
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
								decodeEntities( _title )
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

	// Replace the title and icon displayed in the DocumentBar when there's an overlay visible.
	const title = getEditorCanvasContainerTitle( editorCanvasView );

	const isReady = ! isLoading;
	const transition = {
		duration: disableMotion ? 0 : 0.2,
	};

	return ! isBlockBasedTheme && isHomeRoute ? (
		<SitePreview />
	) : (
		<>
			<GlobalStylesRenderer
				disableRootPadding={ postType !== TEMPLATE_POST_TYPE }
			/>
			<EditorKeyboardShortcutsRegister />
			{ isEditMode && <BlockKeyboardShortcuts /> }
			{ ! isReady ? <CanvasLoader id={ loadingProgressId } /> : null }
			{ isEditMode && (
				<WelcomeGuide
					postType={ postWithTemplate ? context.postType : postType }
				/>
			) }
			{ isReady && (
				<Editor
					postType={ postWithTemplate ? context.postType : postType }
					postId={ postWithTemplate ? context.postId : postId }
					templateId={ postWithTemplate ? postId : undefined }
					settings={ settings }
					className="edit-site-editor__editor-interface"
					styles={ styles }
					customSaveButton={
						_isPreviewingTheme && <SaveButton size="compact" />
					}
					customSavePanel={ _isPreviewingTheme && <SavePanel /> }
					forceDisableBlockTools={ ! hasDefaultEditorCanvasView }
					title={ title }
					iframeProps={ iframeProps }
					onActionPerformed={ onActionPerformed }
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
									<motion.div
										className="edit-site-editor__view-mode-toggle"
										transition={ transition }
										animate="edit"
										initial="edit"
										whileHover="hover"
										whileTap="tap"
									>
										<Button
											__next40pxDefaultSize
											label={ __( 'Open Navigation' ) }
											showTooltip
											tooltipPosition="middle right"
											onClick={ () => {
												resetZoomLevel();

												// TODO: this is a temporary solution to navigate to the posts list if we are
												// come here through `posts list` and are in focus mode editing a template, template part etc..
												if (
													isPostsList &&
													location.query?.focusMode
												) {
													history.navigate( '/', {
														transition:
															'canvas-mode-view-transition',
													} );
												} else {
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
												}
											} }
										>
											<motion.div
												variants={ siteIconVariants }
											>
												<SiteIcon className="edit-site-editor__view-mode-toggle-icon" />
											</motion.div>
										</Button>
										<motion.div
											className={ clsx(
												'edit-site-editor__back-icon',
												{
													'has-site-icon':
														hasSiteIcon,
												}
											) }
											variants={ toggleHomeIconVariants }
										>
											<Icon icon={ arrowUpLeft } />
										</motion.div>
									</motion.div>
								)
							}
						</BackButton>
					) }
					<SiteEditorMoreMenu />
					{ isBlockBasedTheme && <GlobalStylesSidebar /> }
				</Editor>
			) }
		</>
	);
}
