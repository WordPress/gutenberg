/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
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
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Page } from '@wordpress/admin-ui';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import SavePanel from '../save-panel';
import CanvasRenderer from '../canvas-renderer';
import useRouteTitle from '../app/use-route-title';
import { unlock } from '../../lock-unlock';
import type { CanvasData } from '../../store/types';
import './style.scss';
import { UserThemeProvider } from '../user-theme-provider';

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

	return (
		<SlotFillProvider>
			<UserThemeProvider isRoot color={ { bg: '#f8f8f8' } }>
				<UserThemeProvider color={ { bg: '#1d2327' } }>
					<div
						className={ clsx( 'boot-layout', {
							'has-canvas': !! canvas || canvas === null,
							'has-full-canvas': isFullScreen,
						} ) }
					>
						<SavePanel />
						<SnackbarNotices className="boot-notices__snackbar" />
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
											duration: disableMotion ? 0 : 0.2,
											ease: 'easeOut',
										} }
										className="boot-layout__sidebar-backdrop"
										onClick={ () =>
											setIsMobileSidebarOpen( false )
										}
										onKeyDown={ ( event ) => {
											if ( event.key === 'Escape' ) {
												setIsMobileSidebarOpen( false );
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
											duration: disableMotion ? 0 : 0.2,
											ease: 'easeOut',
										} }
										className="boot-layout__sidebar is-mobile"
									>
										<Sidebar />
									</motion.div>
								) }
						</AnimatePresence>
						{ /* Desktop Sidebar */ }
						{ ! isMobileViewport && ! isFullScreen && (
							<div className="boot-layout__sidebar">
								<Sidebar />
							</div>
						) }
						<div className="boot-layout__surfaces">
							<UserThemeProvider color={ { bg: '#ffffff' } }>
								<Outlet />
								{ /* Render Canvas in Root to prevent remounting on route changes */ }
								{ ( canvas || canvas === null ) && (
									<div
										className={ clsx(
											'boot-layout__canvas',
											{
												'has-mobile-drawer':
													canvas?.isPreview &&
													isMobileViewport,
											}
										) }
									>
										{ canvas?.isPreview &&
											isMobileViewport && (
												<div className="boot-layout__mobile-sidebar-drawer">
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
										<CanvasRenderer
											canvas={ canvas }
											routeContentModule={
												routeContentModule
											}
										/>
									</div>
								) }
							</UserThemeProvider>
						</div>
					</div>
				</UserThemeProvider>
			</UserThemeProvider>
		</SlotFillProvider>
	);
}
