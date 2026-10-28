import clsx from 'clsx';
import type { ComponentType, CSSProperties } from 'react';
import { privateApis as routePrivateApis, useNavigate } from '@wordpress/route';
import { SnackbarNotices } from '@wordpress/notices';
import { SlotFillProvider, Slot } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useResizeObserver } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import {
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { wordpress } from '@wordpress/icons';
import { UnsavedChangesWarning } from '@wordpress/editor';
import { getAdminThemeColors } from '@wordpress/admin-ui';
import { inertValue } from '@wordpress/react-inert-value';
// The site shell is a prototype built on `@wordpress/ui` throughout.
import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Button,
	// eslint-disable-next-line @wordpress/use-recommended-components
	IconButton,
	Tooltip,
} from '@wordpress/ui';
import { ThemeProvider } from '@wordpress/theme';
import Navigation from '../navigation';
import SavePanel from '../save-panel';
import ErrorBoundary from '../error-boundary';
import CanvasRenderer from '../canvas-renderer';
import PluginArea from '../plugin-area';
import useRouteTitle from '../app/use-route-title';
import { unlock } from '../../lock-unlock';
import { store as bootStore } from '../../store';
import type { CanvasData } from '../../store/types';
import styles from './shell.module.scss';

const { useLocation, useMatches, Outlet } = unlock( routePrivateApis );

// Where the site route puts what it offers for the page it shows, such as
// editing it.
const BAR_SLOT = 'SiteShellBarActions';

/**
 * Renders the canvas the site route exports, so the shell can keep the site
 * mounted behind every other route.
 *
 * @param props          Component props.
 * @param props.isActive Whether the site is the current route.
 * @return The site canvas, once loaded.
 */
function SiteCanvas( { isActive }: { isActive: boolean } ) {
	const contentModule = useSelect(
		( select ) =>
			select( bootStore )
				.getRoutes()
				.find( ( route ) => route.path === '/' )?.content_module,
		[]
	);
	const [ CustomCanvas, setCustomCanvas ] = useState< ComponentType< {
		isActive: boolean;
	} > | null >( null );

	useEffect( () => {
		if ( ! contentModule ) {
			return;
		}
		import( contentModule )
			.then( ( module ) => setCustomCanvas( () => module.canvas ) )
			.catch( ( error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Failed to load the site canvas:', error );
			} );
	}, [ contentModule ] );

	if ( ! CustomCanvas ) {
		return null;
	}

	return <CustomCanvas isActive={ isActive } />;
}

// Matches `--site-shell-menu-width` and `--site-shell-gap` in the styles,
// which size the menu the site is placed beside and inside.
const MENU_WIDTH = 240;
const GAP = 12;

type SiteLayout = 'full' | 'beside-menu' | 'thumbnail';

/**
 * Places the site layer for each layout. The site is always scaled rather
 * than resized, so it keeps the layout of the full page and never reflows
 * while it moves.
 *
 * @param layout The site's layout.
 * @param width  Width of the area below the bar.
 * @param height Height of the area below the bar.
 * @return The site layer's style, and the space the thumbnail takes.
 */
function getSiteStyle(
	layout: SiteLayout,
	width: number,
	height: number
): { style: CSSProperties; thumbnailHeight: number } {
	const direction = isRTL() ? -1 : 1;

	if ( ! width || ! height || layout === 'full' ) {
		return { style: {}, thumbnailHeight: 0 };
	}

	// Beside the menu, the site is scaled to the width left over. It is made
	// taller by as much, so that once scaled it still fills the height.
	if ( layout === 'beside-menu' ) {
		const scale = ( width - MENU_WIDTH ) / width;
		return {
			style: {
				height: height / scale,
				transform: `translateX(${
					direction * MENU_WIDTH
				}px) scale(${ scale })`,
			},
			thumbnailHeight: 0,
		};
	}

	// In the menu's footer, the site is scaled to the menu's width.
	const scale = ( MENU_WIDTH - GAP * 2 ) / width;
	const thumbnailHeight = height * scale;
	return {
		style: {
			height,
			transform: `translate(${ direction * GAP }px, ${
				height - thumbnailHeight - GAP
			}px) scale(${ scale })`,
			[ '--site-shell-pip-scale' as string ]: scale,
		},
		thumbnailHeight,
	};
}

/**
 * Root component for the site shell layout: a bar along the top, the site
 * below it, and admin screens opened from a menu beside the site.
 *
 * The menu and the site never overlap. Opening the menu shrinks the site to
 * make room, and opening an admin screen shrinks it into the menu's footer.
 */
export default function RootShell() {
	const location = useLocation();
	const navigate = useNavigate();
	const matches = useMatches();
	const routeCanvas = (
		matches[ matches.length - 1 ]?.loaderData as
			{ canvas?: CanvasData | null } | undefined
	 )?.canvas;
	// A route with an editor canvas, such as editing a page or a template.
	const editorCanvas =
		routeCanvas && ! routeCanvas.isPreview ? routeCanvas : undefined;
	const isSiteActive = location.pathname === '/';
	const isEditing = !! editorCanvas;
	const isAdminActive = ! isSiteActive && ! isEditing;
	const menuId = useId();

	// The menu toggle shows or hides the menu. It starts hidden on the site
	// and in the editor, and shown on admin screens. The last is remembered.
	const [ isSiteMenuOpen, setIsSiteMenuOpen ] = useState( false );
	const [ isAdminMenuHidden, setIsAdminMenuHidden ] = useState( false );
	const isMenuOpen = isAdminActive ? ! isAdminMenuHidden : isSiteMenuOpen;
	const menuRef = useRef< HTMLDivElement >( null );
	const shouldFocusMenuRef = useRef( false );

	// The site and the editor start with the menu closed.
	useEffect( () => {
		setIsSiteMenuOpen( false );
	}, [ location.pathname ] );

	// Opening the menu moves focus into it.
	useEffect( () => {
		if ( isMenuOpen && shouldFocusMenuRef.current ) {
			shouldFocusMenuRef.current = false;
			menuRef.current
				?.querySelector< HTMLElement >( 'a, button' )
				?.focus();
		}
	}, [ isMenuOpen ] );

	const [ size, setSize ] = useState( { width: 0, height: 0 } );
	const bodyRef = useResizeObserver( ( [ entry ] ) =>
		setSize( {
			width: entry.contentRect.width,
			height: entry.contentRect.height,
		} )
	);

	// In the editor, the site stays where it was, behind it, so the editor
	// crossfades from it. The editor already shows the site, so it is not
	// shown again in the menu's footer.
	let siteLayout: SiteLayout = 'full';
	if ( isAdminActive ) {
		siteLayout = 'thumbnail';
	} else if ( isSiteActive && isMenuOpen ) {
		siteLayout = 'beside-menu';
	}
	// With the menu hidden on an admin screen, the thumbnail leaves with it.
	const isSiteHidden = isAdminActive && ! isMenuOpen;
	const { style: siteStyle, thumbnailHeight } = getSiteStyle(
		siteLayout,
		size.width,
		size.height
	);

	const siteTitle = useSelect(
		( select ) =>
			decodeEntities(
				(
					select( coreStore ).getEntityRecord(
						'root',
						'__unstableBase'
					) as { name?: string } | undefined
				 )?.name ?? ''
			),
		[]
	);

	useRouteTitle();

	const themeColors = useMemo( getAdminThemeColors, [] );

	return (
		<SlotFillProvider>
			<Tooltip.Provider>
				<PluginArea />
				<ThemeProvider
					isRoot
					color={ { ...themeColors, background: '#f8f8f8' } }
				>
					<div
						className={ clsx( styles.shell, {
							[ styles[ 'is-site' ] ]: isSiteActive,
							[ styles[ 'is-admin' ] ]: isAdminActive,
							[ styles[ 'is-editing' ] ]: isEditing,
							[ styles[ 'is-menu-open' ] ]: isMenuOpen,
						} ) }
						style={
							{
								'--site-shell-thumbnail-space': `${
									thumbnailHeight
										? thumbnailHeight + GAP * 2
										: 0
								}px`,
							} as CSSProperties
						}
					>
						<UnsavedChangesWarning />
						<SavePanel />
						<SnackbarNotices
							className={ styles[ 'notices-snackbar' ] }
						/>
						<ThemeProvider
							color={ { ...themeColors, background: '#1e1e1e' } }
						>
							<header className={ styles.bar }>
								<IconButton
									variant="minimal"
									tone="neutral"
									icon={ wordpress }
									label={ __( 'Menu' ) }
									aria-expanded={ isMenuOpen }
									aria-controls={ menuId }
									onClick={ () => {
										shouldFocusMenuRef.current =
											! isMenuOpen;
										if ( isAdminActive ) {
											setIsAdminMenuHidden(
												! isAdminMenuHidden
											);
										} else {
											setIsSiteMenuOpen(
												! isSiteMenuOpen
											);
										}
									} }
								/>
								<Button
									variant="minimal"
									tone="neutral"
									size="compact"
									aria-current={
										isSiteActive ? 'page' : undefined
									}
									onClick={ () => {
										if ( ! isSiteActive ) {
											navigate( { to: '/' } );
										}
									} }
								>
									{ siteTitle || __( 'Site' ) }
								</Button>
								<div className={ styles[ 'bar-actions' ] }>
									<Slot name={ BAR_SLOT } bubblesVirtually />
								</div>
							</header>
						</ThemeProvider>
						<div ref={ bodyRef } className={ styles.body }>
							<ThemeProvider color={ themeColors }>
								<nav
									id={ menuId }
									ref={ menuRef }
									className={ styles.menu }
									aria-label={ __( 'Admin' ) }
									inert={ inertValue( ! isMenuOpen ) }
								>
									<div className={ styles[ 'menu-content' ] }>
										<Navigation />
									</div>
								</nav>
							</ThemeProvider>
							<div
								className={ styles.admin }
								inert={ inertValue( ! isAdminActive ) }
							>
								<ThemeProvider
									color={ {
										...themeColors,
										// Reset to the default background color.
										background: '#fcfcfc',
									} }
								>
									<Outlet />
								</ThemeProvider>
							</div>
							<div
								className={ clsx( styles.site, {
									[ styles[ 'is-thumbnail' ] ]:
										siteLayout === 'thumbnail',
									[ styles[ 'is-hidden' ] ]: isSiteHidden,
								} ) }
								style={ siteStyle }
								inert={ inertValue( isSiteHidden ) }
							>
								<div
									className={ styles[ 'site-frame' ] }
									inert={ inertValue( ! isSiteActive ) }
								>
									<ErrorBoundary>
										<SiteCanvas isActive={ isSiteActive } />
									</ErrorBoundary>
								</div>
								{ siteLayout === 'thumbnail' && (
									<Button
										variant="unstyled"
										className={ styles[ 'site-return' ] }
										aria-label={ __( 'Return to site' ) }
										onClick={ () =>
											navigate( { to: '/' } )
										}
									/>
								) }
							</div>
							{ editorCanvas && (
								<div className={ styles.editor }>
									<ErrorBoundary>
										<CanvasRenderer
											canvas={ editorCanvas }
										/>
									</ErrorBoundary>
								</div>
							) }
						</div>
					</div>
				</ThemeProvider>
			</Tooltip.Provider>
		</SlotFillProvider>
	);
}
