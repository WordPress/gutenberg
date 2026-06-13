/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { NavigableRegion, getAdminThemeColors } from '@wordpress/admin-ui';
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
	__unstableUseNavigateRegions as useNavigateRegions,
	SlotFillProvider,
} from '@wordpress/components';
import {
	useReducedMotion,
	useViewportMatch,
	useResizeObserver,
	usePrevious,
} from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useRef, useEffect, useMemo } from '@wordpress/element';
import {
	UnsavedChangesWarning,
	ErrorBoundary,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as themePrivateApis } from '@wordpress/theme';
import { PluginArea } from '@wordpress/plugins';
import { SnackbarNotices, store as noticesStore } from '@wordpress/notices';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
// eslint-disable-next-line @wordpress/use-recommended-components -- `Tooltip` is not yet on the recommended `@wordpress/ui` allow-list; landing as a migration step ahead of the wider rollout.
import { Tooltip } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { default as SiteHub, SiteHubMobile } from '../site-hub';
import ResizableFrame from '../resizable-frame';
import { unlock } from '../../lock-unlock';
import SaveKeyboardShortcut from '../save-keyboard-shortcut';
import { useIsSiteEditorLoading } from './hooks';
import useMovingAnimation from './animation';
import { SidebarContent, SidebarNavigationProvider } from '../sidebar';
import SaveHub from '../save-hub';
import SavePanel from '../save-panel';

const { useLocation } = unlock( routerPrivateApis );
const { useStyle, UploadProgressSnackbar } = unlock( editorPrivateApis );
const { ThemeProvider } = unlock( themePrivateApis );

const ANIMATION_DURATION = 0.3;
const CONTENT_COLOR = { background: '#ffffff' };

function Layout() {
	const { query, name: routeKey, areas, widths } = useLocation();
	// Force canvas to 'view' on notfound route to show the error message and allow navigation.
	const canvas = routeKey === 'notfound' ? 'view' : query?.canvas ?? 'view';
	const hasAdminBarInEditor = window.__experimentalAdminBarInEditor;
	const showDesktopSiteHub = ! hasAdminBarInEditor;
	const showMobileSiteHub = ! hasAdminBarInEditor || routeKey !== 'home';
	const hasMobileAreas =
		areas.mobileSidebar || areas.mobileContent || areas.preview;
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const toggleRef = useRef();
	const navigateRegionsProps = useNavigateRegions();
	const disableMotion = useReducedMotion();
	const [ canvasResizer, canvasSize ] = useResizeObserver();
	const isEditorLoading = useIsSiteEditorLoading();
	const [ isResizableFrameOversized, setIsResizableFrameOversized ] =
		useState( false );
	const animationRef = useMovingAnimation( {
		triggerAnimationOnChange: routeKey + '-' + canvas,
	} );

	const { showIconLabels } = useSelect( ( select ) => {
		return {
			showIconLabels: select( preferencesStore ).get(
				'core',
				'showIconLabels'
			),
		};
	} );

	const backgroundColor = useStyle( 'color.background' );
	const gradientValue = useStyle( 'color.gradient' );
	const previousCanvaMode = usePrevious( canvas );
	useEffect( () => {
		if ( previousCanvaMode === 'edit' ) {
			toggleRef.current?.focus();
		}
		// Should not depend on the previous canvas mode value but the next.
	}, [ canvas ] );

	return (
		<>
			<UnsavedChangesWarning />
			{ canvas === 'view' && <SaveKeyboardShortcut /> }
			<div
				{ ...navigateRegionsProps }
				ref={ navigateRegionsProps.ref }
				className={ clsx(
					'edit-site-layout',
					navigateRegionsProps.className,
					{
						'is-full-canvas': canvas === 'edit',
						'show-icon-labels': showIconLabels,
					}
				) }
			>
				<div className="edit-site-layout__content">
					{ /*
						The NavigableRegion must always be rendered and not use
						`inert` otherwise `useNavigateRegions` will fail.
					*/ }
					{ ( ! isMobileViewport || ! hasMobileAreas ) && (
						<NavigableRegion
							ariaLabel={ __( 'Navigation' ) }
							className="edit-site-layout__sidebar-region"
						>
							<AnimatePresence>
								{ canvas === 'view' && (
									<motion.div
										initial={ { opacity: 0 } }
										animate={ { opacity: 1 } }
										exit={ { opacity: 0 } }
										transition={ {
											type: 'tween',
											duration:
												// Disable transition in mobile to emulate a full page transition.
												disableMotion ||
												isMobileViewport
													? 0
													: ANIMATION_DURATION,
											ease: 'easeOut',
										} }
										className="edit-site-layout__sidebar"
									>
										{ showDesktopSiteHub && (
											<SiteHub
												ref={ toggleRef }
												isTransparent={
													isResizableFrameOversized
												}
											/>
										) }
										<SidebarNavigationProvider>
											<SidebarContent
												shouldAnimate={
													routeKey !== 'styles' &&
													routeKey !== 'identity'
												}
												routeKey={ routeKey }
											>
												<ErrorBoundary>
													{ areas.sidebar }
												</ErrorBoundary>
											</SidebarContent>
										</SidebarNavigationProvider>
										<SaveHub />
										<SavePanel />
									</motion.div>
								) }
							</AnimatePresence>
						</NavigableRegion>
					) }

					<SnackbarNotices className="edit-site-layout__snackbar" />
					<UploadProgressSnackbar />

					{ isMobileViewport && hasMobileAreas && (
						<div className="edit-site-layout__mobile">
							<SidebarNavigationProvider>
								{ canvas !== 'edit' ? (
									<>
										{ showMobileSiteHub && (
											<SiteHubMobile
												ref={ toggleRef }
												isTransparent={
													isResizableFrameOversized
												}
											/>
										) }
										{ areas.mobileContent ? (
											/*
											 * ThemeProvider wraps SidebarContent (rather than
											 * just the content) so the scroll wrapper it renders
											 * inherits the content background tokens. See
											 * `.edit-site-sidebar__screen-wrapper` in style.scss.
											 */
											<ThemeProvider
												color={ CONTENT_COLOR }
											>
												<SidebarContent
													routeKey={ routeKey }
												>
													<div className="edit-site-layout__mobile-content">
														<ErrorBoundary>
															{
																areas.mobileContent
															}
														</ErrorBoundary>
													</div>
												</SidebarContent>
											</ThemeProvider>
										) : (
											<SidebarContent
												routeKey={ routeKey }
											>
												<ErrorBoundary>
													{ areas.mobileSidebar }
												</ErrorBoundary>
											</SidebarContent>
										) }
										<SaveHub />
										<SavePanel />
									</>
								) : (
									<ThemeProvider color={ CONTENT_COLOR }>
										<ErrorBoundary>
											{ areas.preview }
										</ErrorBoundary>
									</ThemeProvider>
								) }
							</SidebarNavigationProvider>
						</div>
					) }

					{ ! isMobileViewport &&
						areas.content &&
						canvas !== 'edit' && (
							<div
								className="edit-site-layout__area"
								style={ {
									maxWidth: widths?.content,
								} }
							>
								<ThemeProvider color={ CONTENT_COLOR }>
									<ErrorBoundary>
										{ areas.content }
									</ErrorBoundary>
								</ThemeProvider>
							</div>
						) }

					{ ! isMobileViewport && areas.edit && canvas !== 'edit' && (
						<div
							className="edit-site-layout__area"
							style={ {
								maxWidth: widths?.edit,
							} }
						>
							<ThemeProvider color={ CONTENT_COLOR }>
								<ErrorBoundary>{ areas.edit }</ErrorBoundary>
							</ThemeProvider>
						</div>
					) }

					{ ! isMobileViewport && areas.preview && (
						<div className="edit-site-layout__canvas-container">
							{ canvasResizer }
							{ !! canvasSize.width && (
								<div
									className={ clsx(
										'edit-site-layout__canvas',
										{
											'is-right-aligned':
												isResizableFrameOversized,
										}
									) }
									ref={ animationRef }
								>
									<ErrorBoundary>
										<ResizableFrame
											isReady={ ! isEditorLoading }
											isFullWidth={ canvas === 'edit' }
											defaultSize={ {
												width:
													canvasSize.width -
													24 /* $canvas-padding */,
												height: canvasSize.height,
											} }
											isOversized={
												isResizableFrameOversized
											}
											setIsOversized={
												setIsResizableFrameOversized
											}
											innerContentStyle={ {
												background:
													gradientValue ??
													backgroundColor,
											} }
										>
											<ThemeProvider
												color={ CONTENT_COLOR }
											>
												{ areas.preview }
											</ThemeProvider>
										</ResizableFrame>
									</ErrorBoundary>
								</div>
							) }
						</div>
					) }
				</div>
			</div>
		</>
	);
}

export default function LayoutWithGlobalStylesProvider( props ) {
	const themeColors = useMemo( getAdminThemeColors, [] );
	const { createErrorNotice } = useDispatch( noticesStore );
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

	return (
		<SlotFillProvider>
			<Tooltip.Provider>
				{ /** This needs to be within the SlotFillProvider */ }
				<PluginArea onError={ onPluginAreaError } />
				<ThemeProvider color={ themeColors }>
					<Layout { ...props } />
				</ThemeProvider>
			</Tooltip.Provider>
		</SlotFillProvider>
	);
}
