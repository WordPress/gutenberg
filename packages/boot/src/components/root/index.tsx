import clsx from 'clsx';
import { privateApis as routePrivateApis } from '@wordpress/route';
import { SnackbarNotices } from '@wordpress/notices';
import { useViewportMatch, useReducedMotion } from '@wordpress/compose';
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
	Button,
	SlotFillProvider,
} from '@wordpress/components';
import { menu } from '@wordpress/icons';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { UnsavedChangesWarning } from '@wordpress/editor';
import { Page, getAdminThemeColors } from '@wordpress/admin-ui';
import { Tooltip } from '@wordpress/ui';
import { ThemeProvider } from '@wordpress/theme';
import Sidebar from '../sidebar';
import SavePanel from '../save-panel';
import CanvasRenderer from '../canvas-renderer';
import ErrorBoundary from '../error-boundary';
import PluginArea from '../plugin-area';
import useRouteTitle from '../app/use-route-title';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';
import useSyncBodyBackground from './use-sync-body-background';
import styles from './style.module.scss';

const { useLocation, useMatches, Outlet } = unlock( routePrivateApis );

export default function Root() {
	const matches = useMatches();
	const location = useLocation();
	const currentMatch = matches[ matches.length - 1 ];
	const canvas = ( currentMatch?.loaderData as any )?.canvas as
		| CanvasData
		| null
		| undefined;
	const routeContentModule = ( currentMatch?.loaderData as any )
		?.routeContentModule as string | undefined;
	const isFullScreen = canvas && ! canvas.isPreview;

	useRouteTitle();

	// Mobile sidebar state
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ isMobileSidebarOpen, setIsMobileSidebarOpen ] = useState( false );
	const disableMotion = useReducedMotion();
	// Close mobile sidebar on viewport resize and path change
	useEffect( () => {
		setIsMobileSidebarOpen( false );
	}, [ location.pathname, isMobileViewport ] );

	const themeColors = useMemo( getAdminThemeColors, [] );

	const layoutRef = useSyncBodyBackground();

	return (
		<SlotFillProvider>
			<Tooltip.Provider>
				<PluginArea />
				<ThemeProvider
					isRoot
					color={ { ...themeColors, background: '#f8f8f8' } }
				>
					<ThemeProvider color={ themeColors }>
						<div
							ref={ layoutRef }
							className={ clsx( styles.layout, {
								[ styles[ 'has-canvas' ] ]:
									!! canvas || canvas === null,
								[ styles[ 'has-full-canvas' ] ]: isFullScreen,
							} ) }
						>
							<UnsavedChangesWarning />
							<SavePanel />
							<SnackbarNotices
								className={ styles[ 'notices-snackbar' ] }
							/>
							{ isMobileViewport && (
								<Page.SidebarToggleFill>
									<Button
										icon={ menu }
										onClick={ () =>
											setIsMobileSidebarOpen( true )
										}
										label={ __( 'Open navigation panel' ) }
										size="compact"
									/>
								</Page.SidebarToggleFill>
							) }
							{ /* Mobile Sidebar Backdrop */ }
							<AnimatePresence>
								{ isMobileViewport &&
									isMobileSidebarOpen &&
									! isFullScreen && (
										<motion.div
											initial={ { opacity: 0 } }
											animate={ { opacity: 1 } }
											exit={ { opacity: 0 } }
											transition={ {
												type: 'tween',
												duration: disableMotion
													? 0
													: 0.2,
												ease: 'easeOut',
											} }
											className={
												styles[ 'sidebar-backdrop' ]
											}
											onClick={ () =>
												setIsMobileSidebarOpen( false )
											}
											onKeyDown={ ( event ) => {
												if ( event.key === 'Escape' ) {
													setIsMobileSidebarOpen(
														false
													);
												}
											} }
											role="button"
											tabIndex={ -1 }
											aria-label={ __(
												'Close navigation panel'
											) }
										/>
									) }
							</AnimatePresence>
							{ /* Mobile Sidebar */ }
							<AnimatePresence>
								{ isMobileViewport &&
									isMobileSidebarOpen &&
									! isFullScreen && (
										<motion.div
											initial={ { x: '-100%' } }
											animate={ { x: 0 } }
											exit={ { x: '-100%' } }
											transition={ {
												type: 'tween',
												duration: disableMotion
													? 0
													: 0.2,
												ease: 'easeOut',
											} }
											className={ clsx(
												styles.sidebar,
												styles[ 'is-mobile' ]
											) }
										>
											<Sidebar />
										</motion.div>
									) }
							</AnimatePresence>
							{ /* Desktop Sidebar */ }
							{ ! isMobileViewport && ! isFullScreen && (
								<div className={ styles.sidebar }>
									<Sidebar />
								</div>
							) }
							<div className={ styles.surfaces }>
								<ThemeProvider
									color={ {
										...themeColors,
										background: '#ffffff',
									} }
								>
									<Outlet />
									{ /* Render Canvas in Root to prevent remounting on route changes */ }
									{ ( canvas || canvas === null ) && (
										<div
											className={ clsx( styles.canvas, {
												[ styles[
													'has-mobile-drawer'
												] ]:
													canvas?.isPreview &&
													isMobileViewport,
											} ) }
										>
											{ canvas?.isPreview &&
												isMobileViewport && (
													<div
														className={
															styles[
																'mobile-sidebar-drawer'
															]
														}
													>
														<Button
															icon={ menu }
															onClick={ () =>
																setIsMobileSidebarOpen(
																	true
																)
															}
															label={ __(
																'Open navigation panel'
															) }
															size="compact"
														/>
													</div>
												) }
											<ErrorBoundary>
												<CanvasRenderer
													canvas={ canvas }
													routeContentModule={
														routeContentModule
													}
												/>
											</ErrorBoundary>
										</div>
									) }
								</ThemeProvider>
							</div>
						</div>
					</ThemeProvider>
				</ThemeProvider>
			</Tooltip.Provider>
		</SlotFillProvider>
	);
}
