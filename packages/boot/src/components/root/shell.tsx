import clsx from 'clsx';
import type { ComponentType, CSSProperties } from 'react';
import { privateApis as routePrivateApis, useNavigate } from '@wordpress/route';
import { SnackbarNotices } from '@wordpress/notices';
import { SlotFillProvider, Slot } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useResizeObserver } from '@wordpress/compose';
import {
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { styles as stylesIcon, wordpress } from '@wordpress/icons';
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
import SaveButton from '../save-button';
import ErrorBoundary from '../error-boundary';
import CanvasRenderer from '../canvas-renderer';
import ShellAccountMenu from './shell-account-menu';
import ShellNotifications from './shell-notifications';
import ShellDocumentBar from './shell-document-bar';
import ShellSiteIdentity from './shell-site-identity';
import PluginArea from '../plugin-area';
import useRouteTitle from '../app/use-route-title';
import { unlock } from '../../lock-unlock';
import { store as bootStore } from '../../store';
import type { CanvasData } from '../../store/types';
import styles from './shell.module.scss';

const { useMatches, Outlet } = unlock( routePrivateApis );

// Where the site route puts what it offers for the page it shows, such as
// editing it.
const BAR_SLOT = 'SiteShellBarActions';

/**
 * Renders the canvas the site route exports, so the shell can keep the site
 * mounted behind every other route.
 *
 * @param props           Component props.
 * @param props.isActive  Whether the site is the current route.
 * @param props.isStyling Whether its styles are being edited beside it.
 * @return The site canvas, once loaded.
 */
function SiteCanvas( {
	isActive,
	isStyling,
}: {
	isActive: boolean;
	isStyling: boolean;
} ) {
	const contentModule = useSelect(
		( select ) =>
			select( bootStore )
				.getRoutes()
				.find( ( route ) => route.path === '/' )?.content_module,
		[]
	);
	const [ CustomCanvas, setCustomCanvas ] = useState< ComponentType< {
		isActive: boolean;
		isStyling: boolean;
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

	return <CustomCanvas isActive={ isActive } isStyling={ isStyling } />;
}

// Matches `--site-shell-menu-width`, `--site-shell-gap` and
// `--site-shell-inset` in the styles, which size the menu the site is placed
// beside and inside, and the space left around it beside the menu.
const MENU_WIDTH = 240;
const GAP = 12;
const INSET = 8;
// Matches `--site-shell-styles-width`, the styles panel beside the site.
const STYLES_WIDTH = 360;
const THUMBNAIL_HOVER_SCALE = 1.04;

type SiteLayout = 'full' | 'beside-menu' | 'beside-styles' | 'thumbnail';

/**
 * Places the site layer for each layout. The site is always scaled rather
 * than resized, so it keeps the layout of the full page and never reflows
 * while it moves.
 *
 * @param layout     The site's layout.
 * @param width      Width of the area below the bar.
 * @param height     Height of the area below the bar.
 * @param isMenuOpen Whether the menu is open beside the site.
 * @return The site layer's style, and the space the thumbnail takes.
 */
function getSiteStyle(
	layout: SiteLayout,
	width: number,
	height: number,
	isMenuOpen: boolean
): { style: CSSProperties; thumbnailHeight: number } {
	const direction = isRTL() ? -1 : 1;

	if ( ! width || ! height || layout === 'full' ) {
		return { style: {}, thumbnailHeight: 0 };
	}

	// Beside the menu, the site is scaled to the width left over, less a
	// small inset on its other sides. It is made taller by as much, so that
	// once scaled it still fills the height.
	if ( layout === 'beside-menu' ) {
		const scale = ( width - MENU_WIDTH - INSET ) / width;
		return {
			style: {
				height: ( height - INSET * 2 ) / scale,
				transform: `translate(${
					direction * MENU_WIDTH
				}px, ${ INSET }px) scale(${ scale })`,
				[ '--site-shell-pip-scale' as string ]: scale,
			},
			thumbnailHeight: 0,
		};
	}

	// While styling, the site sits between the menu, when it is open, and the
	// styles panel, flush with the bar like the panel.
	if ( layout === 'beside-styles' ) {
		const start = isMenuOpen ? MENU_WIDTH : INSET;
		const scale = ( width - start - INSET - STYLES_WIDTH - INSET ) / width;
		return {
			style: {
				height: ( height - INSET ) / scale,
				transform: `translate(${
					direction * start
				}px, 0) scale(${ scale })`,
				[ '--site-shell-pip-scale' as string ]: scale,
			},
			thumbnailHeight: 0,
		};
	}

	// In the menu's footer, the site is scaled to the menu's width.
	const scale = ( MENU_WIDTH - GAP * 2 ) / width;
	const thumbnailWidth = MENU_WIDTH - GAP * 2;
	const thumbnailHeight = height * scale;
	const x = GAP;
	const y = height - thumbnailHeight - GAP;
	// Grown slightly about its own centre on hover and focus, to hint that it
	// returns to the site.
	const hoverGrowth = THUMBNAIL_HOVER_SCALE - 1;
	return {
		style: {
			height,
			transform: `translate(${ direction * x }px, ${ y }px) scale(${ scale })`,
			[ '--site-shell-pip-scale' as string ]: scale,
			[ '--site-shell-thumbnail-hover-transform' as string ]: `translate(${
				direction * ( x - ( thumbnailWidth * hoverGrowth ) / 2 )
			}px, ${ y - ( thumbnailHeight * hoverGrowth ) / 2 }px) scale(${
				scale * THUMBNAIL_HOVER_SCALE
			})`,
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
	const navigate = useNavigate();
	// Everything is read from the loaded route, not the location, which
	// changes as soon as a route starts loading. Mixing the two puts the shell
	// briefly in the wrong state, such as shrinking the site on the way into
	// the editor because the editor's canvas has not arrived yet.
	const matches = useMatches();
	const currentMatch = matches[ matches.length - 1 ];
	const pathname = currentMatch?.pathname;
	const routeCanvas = (
		currentMatch?.loaderData as { canvas?: CanvasData | null } | undefined
	 )?.canvas;
	// A route with an editor canvas, such as editing a page or a template.
	const editorCanvas =
		routeCanvas && ! routeCanvas.isPreview ? routeCanvas : undefined;
	const isSiteActive = pathname === '/';
	// Styling the site, with the styles panel beside it.
	const isStyling = pathname === '/styles';
	const isEditing = !! editorCanvas;
	const isAdminActive = ! isSiteActive && ! isEditing && ! isStyling;
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
	}, [ pathname ] );

	// Opening the menu from the keyboard moves focus into it. A pointer
	// leaves focus on the toggle, as with any other toggle, so nothing in the
	// menu looks focused.
	useEffect( () => {
		if ( isMenuOpen && shouldFocusMenuRef.current ) {
			shouldFocusMenuRef.current = false;
			menuRef.current
				?.querySelector< HTMLElement >( 'a, button' )
				?.focus();
		}
	}, [ isMenuOpen ] );

	// The editor header is laid out between the bar's two ends, so it needs
	// their widths.
	const [ barEnds, setBarEnds ] = useState( { start: 0, end: 0 } );
	const barStartRef = useResizeObserver( ( [ entry ] ) =>
		setBarEnds( ( ends ) => ( {
			...ends,
			start: entry.borderBoxSize[ 0 ].inlineSize,
		} ) )
	);
	const barEndRef = useResizeObserver( ( [ entry ] ) =>
		setBarEnds( ( ends ) => ( {
			...ends,
			end: entry.borderBoxSize[ 0 ].inlineSize,
		} ) )
	);

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
	} else if ( isStyling ) {
		siteLayout = 'beside-styles';
	} else if ( isSiteActive && isMenuOpen ) {
		siteLayout = 'beside-menu';
	}
	const { style: siteStyle, thumbnailHeight } = getSiteStyle(
		siteLayout,
		size.width,
		size.height,
		isMenuOpen
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
							[ styles[ 'is-styling' ] ]: isStyling,
							[ styles[ 'is-menu-open' ] ]: isMenuOpen,
						} ) }
						style={
							{
								// The open menu already moves the editor past
								// part of the bar's start.
								'--site-shell-editor-header-start': `${
									isMenuOpen
										? Math.max(
												0,
												barEnds.start - MENU_WIDTH
											)
										: barEnds.start
								}px`,
								// So does the inset beside the open menu.
								'--site-shell-editor-header-end': `${
									isMenuOpen
										? Math.max( 0, barEnds.end - INSET )
										: barEnds.end
								}px`,
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
							{ /*
							 * Global items sit at either end of the bar, and
							 * the current workflow fills the middle. In the
							 * editor, that is the editor's own header, laid
							 * out to fit between the two ends.
							 */ }
							<header className={ styles.bar }>
								<div
									ref={ barStartRef }
									className={ styles[ 'bar-start' ] }
								>
									<div
										className={
											styles[ 'bar-menu-toggle' ]
										}
									>
										<IconButton
											variant="minimal"
											tone="neutral"
											icon={ wordpress }
											label={ __( 'Menu' ) }
											aria-expanded={ isMenuOpen }
											aria-controls={ menuId }
											onClick={ ( event ) => {
												// A click from the keyboard has no pointer detail.
												shouldFocusMenuRef.current =
													! isMenuOpen &&
													event.detail === 0;
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
									</div>
									{ ! isEditing && <ShellSiteIdentity /> }
								</div>
								<div className={ styles[ 'bar-context' ] }>
									<Slot name={ BAR_SLOT } bubblesVirtually />
									{ /* The editor saves its own changes. Elsewhere, such as edited styles. */ }
									{ ! isEditing && <SaveButton /> }
								</div>
								{ ( isSiteActive ||
									isEditing ||
									isStyling ) && (
									<ShellDocumentBar
										editorCanvas={ editorCanvas }
									/>
								) }
								<div
									ref={ barEndRef }
									className={ styles[ 'bar-end' ] }
								>
									{ /*
									 * Styles apply to the whole site, so they
									 * sit with the bar's global items rather
									 * than with the document. Styling is part
									 * of viewing the site, so it is offered
									 * only there.
									 */ }
									{ ( isSiteActive || isStyling ) && (
										<IconButton
											variant="minimal"
											tone="neutral"
											icon={ stylesIcon }
											label={ __( 'Styles' ) }
											aria-pressed={ isStyling }
											onClick={ () =>
												navigate( {
													to: isStyling
														? '/'
														: '/styles',
												} )
											}
										/>
									) }
									<div className={ styles[ 'bar-account' ] }>
										<ShellNotifications />
										<ShellAccountMenu />
									</div>
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
								inert={ inertValue(
									! isAdminActive && ! isStyling
								) }
							>
								{ /*
								 * Admin screens take the menu's dark tones.
								 * The styles panel stays light: it is built
								 * from `@wordpress/components`, which do not
								 * read the theme's tokens, so its controls
								 * would stay light on a dark panel.
								 */ }
								<ThemeProvider
									color={
										isStyling
											? {
													...themeColors,
													background: '#fcfcfc',
												}
											: themeColors
									}
								>
									<Outlet />
								</ThemeProvider>
							</div>
							<div
								className={ clsx( styles.site, {
									[ styles[ 'is-thumbnail' ] ]:
										siteLayout === 'thumbnail',
									[ styles[ 'is-beside-menu' ] ]:
										siteLayout === 'beside-menu' ||
										siteLayout === 'beside-styles',
								} ) }
								style={ siteStyle }
							>
								<div
									className={ styles[ 'site-frame' ] }
									// Browsable while styling too, to see the styles on other pages.
									inert={ inertValue(
										! isSiteActive && ! isStyling
									) }
								>
									<ErrorBoundary>
										<SiteCanvas
											isActive={ isSiteActive }
											isStyling={ isStyling }
										/>
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
						</div>
						{ editorCanvas && (
							<div className={ styles.editor }>
								<ErrorBoundary>
									<CanvasRenderer
										canvas={ editorCanvas }
										// The bar is the way back to the site.
										showBackButton={ false }
									/>
								</ErrorBoundary>
							</div>
						) }
					</div>
				</ThemeProvider>
			</Tooltip.Provider>
		</SlotFillProvider>
	);
}
