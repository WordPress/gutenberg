import clsx from 'clsx';
import type { ComponentType, CSSProperties } from 'react';
import { privateApis as routePrivateApis, useNavigate } from '@wordpress/route';
import { SnackbarNotices } from '@wordpress/notices';
import { SlotFillProvider, Slot } from '@wordpress/components';
import {
	resolveSelect,
	select as selectFromRegistry,
	subscribe,
	useDispatch,
	useSelect,
} from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';
import {
	useEffect,
	useId,
	useLayoutEffect,
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
import ShellSearch from './shell-search';
import ShellDocumentBar, { ShellPageBar } from './shell-document-bar';
import ShellNewMenu from './shell-new-menu';
import ShellSiteIdentity from './shell-site-identity';
import PluginArea from '../plugin-area';
import useRouteTitle from '../app/use-route-title';
import { unlock } from '../../lock-unlock';
import { store as bootStore } from '../../store';
import type { CanvasData, RouteBreadcrumb } from '../../store/types';
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

// How long the editor waits, opened from an admin screen, for the site to
// show what it opens, and then for itself to render, before it is shown
// anyway.
const OPENED_FROM_TIMEOUT = 3000;

// How long, in milliseconds, the thumbnail holds a page newly loaded into it
// before growing into the editor, so the change is seen.
const SITE_HOLD = 200;

// How far the site is drawn back in the editor, so editing it looks set apart
// from browsing it.
const EDITOR_CANVAS_SCALE = 0.95;

const EDITOR_CANVAS_STYLE_ID = 'site-shell-editor-canvas-scale';
const EDITOR_CANVAS_DRAWN_BACK_CLASS = 'site-shell-is-drawn-back';

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
 * Finds where an entity is on the site, as a path the site frame can show.
 * Only entities that are public have one: a draft cannot be shown there.
 *
 * @param postType The entity's post type.
 * @param postId   The entity's ID.
 * @return The path, with any query string, or none.
 */
async function getSitePath( postType: string, postId: string ) {
	const [ record, base ] = await Promise.all( [
		resolveSelect( coreStore ).getEntityRecord(
			'postType',
			postType,
			postId
		) as Promise< { link?: string; status?: string } | undefined >,
		resolveSelect( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		) as Promise< { home?: string } | undefined >,
	] );
	if (
		! record?.link ||
		! base?.home ||
		! record.link.startsWith( base.home ) ||
		! [ 'publish', 'private' ].includes( record.status ?? '' )
	) {
		return undefined;
	}
	const url = new URL( record.link );
	return `${ url.pathname }${ url.search }`;
}

/**
 * Shows an entity in the site frame, and waits until it does, or for a while
 * at most.
 *
 * @param showSitePath The boot store action asking the site to show a path.
 * @param postType     The entity's post type.
 * @param postId       The entity's ID.
 * @return Whether the site changed to show it.
 */
async function showInSite(
	showSitePath: ( path: string ) => void,
	postType: string,
	postId: string
) {
	const isShown = () =>
		String( selectFromRegistry( bootStore ).getShownEntity()?.postId ) ===
		postId;
	if ( isShown() ) {
		return false;
	}
	const path = await getSitePath( postType, postId );
	if ( ! path ) {
		return false;
	}
	showSitePath( path );
	await new Promise< void >( ( resolve ) => {
		const done = () => {
			unsubscribe();
			clearTimeout( timeout );
			resolve();
		};
		const unsubscribe = subscribe( () => {
			if ( isShown() ) {
				done();
			}
		}, bootStore );
		const timeout = setTimeout( done, OPENED_FROM_TIMEOUT );
	} );
	return true;
}

/**
 * Waits until the site frame has painted what it loaded, with the images in
 * view, and then a moment more, so the new page is seen in the thumbnail
 * before it grows. The frame's load event comes before its first paint, and
 * the images lazy loading leaves out of it.
 *
 * @param site The site layer.
 */
async function waitForSitePaint( site: HTMLElement | null ) {
	const frame = site?.querySelector( 'iframe' )?.contentWindow;
	const frameDocument = frame?.document;
	if ( ! frame || ! frameDocument ) {
		return;
	}
	const startedAt = performance.now();
	const imagesInView = Array.from( frameDocument.images ).filter(
		( image ) =>
			image.getBoundingClientRect().top < frame.innerHeight &&
			image.getBoundingClientRect().bottom > 0
	);
	await Promise.race( [
		Promise.all(
			imagesInView.map( ( image ) => image.decode().catch( () => {} ) )
		),
		new Promise( ( resolve ) =>
			setTimeout( resolve, OPENED_FROM_TIMEOUT )
		),
	] );
	await new Promise( ( resolve ) =>
		frame.requestAnimationFrame( () =>
			frame.requestAnimationFrame( resolve )
		)
	);
	const remaining = OPENED_FROM_TIMEOUT - ( performance.now() - startedAt );
	await new Promise( ( resolve ) =>
		setTimeout( resolve, Math.max( 0, Math.min( SITE_HOLD, remaining ) ) )
	);
}

/**
 * Fades the editor in over the site once it has rendered its content, so
 * the site, already showing what is edited, turns into the editor rather
 * than into an empty, loading one.
 *
 * @param editor   The editor layer.
 * @param onFinish Called once the editor is shown.
 */
function fadeInEditor( editor: HTMLElement, onFinish: () => void ) {
	const computed = getComputedStyle( editor );
	const durationValue = computed
		.getPropertyValue( '--site-shell-transition-duration' )
		.trim();
	const duration =
		parseFloat( durationValue ) *
		( durationValue.endsWith( 'ms' ) ? 1 : 1000 );
	const animation = editor.animate( [ { opacity: 0 }, { opacity: 1 } ], {
		duration: duration || 0,
		easing:
			computed
				.getPropertyValue( '--site-shell-transition-easing' )
				.trim() || 'ease',
	} );
	animation.pause();
	animation.finished.then( onFinish, onFinish );

	const startedAt = performance.now();
	const isReady = () =>
		!! editor
			.querySelector< HTMLIFrameElement >(
				'iframe[name="editor-canvas"]'
			)
			?.contentDocument?.querySelector( '.is-root-container > *' );
	const playWhenReady = () => {
		// However long the editor takes, it is shown in the end.
		if (
			isReady() ||
			performance.now() - startedAt > OPENED_FROM_TIMEOUT
		) {
			window.requestIdleCallback( () => animation.play(), {
				timeout: 500,
			} );
			return;
		}
		setTimeout( playWhenReady, 50 );
	};
	playWhenReady();
}

/**
 * Draws the site back slightly in the editor's canvas, so editing it looks
 * set apart from browsing it. It scales the canvas document, as the editor's
 * zoom out does, so the editor's toolbars still sit beside the blocks they
 * belong to. It does not zoom out the editor, which would limit editing to
 * whole sections.
 *
 * The editor first shows the site at the size it is browsed at, so it takes
 * over from it unseen, and then draws it back.
 *
 * @param editor      The editor layer, which holds the canvas.
 * @param isDrawnBack Whether to draw the site back yet.
 * @return Stops following the editor's canvas.
 */
function scaleEditorCanvas( editor: HTMLElement, isDrawnBack: boolean ) {
	const computed = getComputedStyle( editor );
	const background = computed
		.getPropertyValue( '--site-shell-bar-background' )
		.trim();
	const duration = computed
		.getPropertyValue( '--site-shell-transition-duration' )
		.trim();
	const easing = computed
		.getPropertyValue( '--site-shell-transition-easing' )
		.trim();
	// Drawn back from the top as well as the sides, as far as from each.
	const inset = `${ ( ( 1 - EDITOR_CANVAS_SCALE ) / 2 ) * 100 }vw`;
	// Not while the editor zooms out itself, which scales the canvas its own way.
	const css = `
		:root:not(.is-zoomed-out) {
			transform-origin: 50% 0;
			background-color: ${ background } !important;
		}
		:root.${ EDITOR_CANVAS_DRAWN_BACK_CLASS }:not(.is-zoomed-out) {
			scale: ${ EDITOR_CANVAS_SCALE };
			translate: 0 ${ inset };
		}
		@media not (prefers-reduced-motion: reduce) {
			:root:not(.is-zoomed-out) {
				transition: scale ${ duration } ${ easing }, translate ${ duration } ${ easing };
			}
		}
	`;

	const scale = ( iframe: HTMLIFrameElement ) => {
		const canvasDocument = iframe.contentDocument;
		if ( ! canvasDocument?.head ) {
			return;
		}
		if ( ! canvasDocument.getElementById( EDITOR_CANVAS_STYLE_ID ) ) {
			const style = canvasDocument.createElement( 'style' );
			style.id = EDITOR_CANVAS_STYLE_ID;
			style.textContent = css;
			canvasDocument.head.append( style );
		}
		canvasDocument.documentElement.classList.toggle(
			EDITOR_CANVAS_DRAWN_BACK_CLASS,
			isDrawnBack
		);
	};

	// The editor renders its canvas when it is ready, and again for each
	// document it opens, which loads it afresh.
	const followed = new WeakSet< HTMLIFrameElement >();
	const follow = () => {
		editor
			.querySelectorAll< HTMLIFrameElement >(
				'iframe[name="editor-canvas"]'
			)
			.forEach( ( iframe ) => {
				scale( iframe );
				if ( ! followed.has( iframe ) ) {
					followed.add( iframe );
					iframe.addEventListener( 'load', () => scale( iframe ) );
				}
			} );
	};
	follow();
	const observer = new window.MutationObserver( follow );
	observer.observe( editor, { childList: true, subtree: true } );
	return () => observer.disconnect();
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
	const {
		canvas: routeCanvas,
		title: routeTitle,
		breadcrumbs: routeBreadcrumbs,
	} = ( currentMatch?.loaderData ?? {} ) as {
		canvas?: CanvasData | null;
		title?: string;
		breadcrumbs?: RouteBreadcrumb[];
	};
	// A route with an editor canvas, such as editing a page or a template.
	const editorCanvas =
		routeCanvas && ! routeCanvas.isPreview ? routeCanvas : undefined;
	const isSiteActive = pathname === '/';
	// Styling the site, with the styles panel beside it.
	const isStyling = pathname === '/styles';
	const isEditing = !! editorCanvas;
	const isAdminActive = ! isSiteActive && ! isEditing && ! isStyling;
	// The trail to an admin screen: the screens it is nested in, if any, and
	// the screen itself.
	let pageTrail: RouteBreadcrumb[] | undefined;
	if ( routeBreadcrumbs?.length ) {
		pageTrail = routeBreadcrumbs;
	} else if ( routeTitle ) {
		pageTrail = [ { label: routeTitle } ];
	}
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
	// The ends hold different items in each mode, such as Styles only on the
	// site. Measured before the new mode paints, so the editor header lays out
	// between them from the start, rather than moving once the observer
	// reports their new widths.
	const barStartElementRef = useRef< HTMLDivElement >( null );
	const barEndElementRef = useRef< HTMLDivElement >( null );
	const barStartRefs = useMergeRefs( [ barStartRef, barStartElementRef ] );
	const barEndRefs = useMergeRefs( [ barEndRef, barEndElementRef ] );
	useLayoutEffect( () => {
		const start = barStartElementRef.current;
		const end = barEndElementRef.current;
		if ( start && end ) {
			setBarEnds( {
				start: start.getBoundingClientRect().width,
				end: end.getBoundingClientRect().width,
			} );
		}
	}, [ isSiteActive, isEditing, isStyling, isAdminActive ] );

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

	const { showSitePath } = useDispatch( bootStore );

	// Opening the editor from an admin screen first shows what it opens in
	// the site's thumbnail, then opens the editor. The site grows out of the
	// thumbnail as it does into the site.
	const [ isEditorPending, setIsEditorPending ] = useState( false );
	const editorRef = useRef< HTMLDivElement >( null );
	const siteRef = useRef< HTMLDivElement >( null );
	const openFromAdmin = async (
		to: string,
		postType: string,
		postId: string
	) => {
		if ( await showInSite( showSitePath, postType, postId ) ) {
			await waitForSitePaint( siteRef.current );
		}
		navigate( { to, viewTransition: false } );
	};
	// However the editor opens, it fades in over the site once its canvas
	// has rendered, keeping the site in view until then, so the site turns
	// into the editor rather than into an empty, loading one.
	useLayoutEffect( () => {
		if ( isEditing && editorRef.current ) {
			setIsEditorPending( true );
			fadeInEditor( editorRef.current, () =>
				setIsEditorPending( false )
			);
		}
	}, [ isEditing ] );

	// The site is drawn back slightly while it is edited, once the editor
	// has taken over from it.
	useEffect( () => {
		if ( ! isEditing || ! editorRef.current ) {
			return undefined;
		}
		return scaleEditorCanvas( editorRef.current, ! isEditorPending );
	}, [ isEditing, isEditorPending ] );

	// Leaving the editor, the site shows what was edited, wherever the shell
	// goes next, such as into an admin screen's thumbnail.
	const lastEditedRef = useRef< CanvasData | undefined >( undefined );
	useEffect( () => {
		if ( editorCanvas ) {
			lastEditedRef.current = editorCanvas;
			return;
		}
		const lastEdited = lastEditedRef.current;
		lastEditedRef.current = undefined;
		if ( lastEdited?.postType && lastEdited.postId ) {
			showInSite(
				showSitePath,
				lastEdited.postType,
				String( lastEdited.postId )
			);
		}
	}, [ editorCanvas, showSitePath ] );

	// The editor's scripts and styles are loaded ahead of opening it from an
	// admin screen, so it renders soon after, and grows into place.
	useEffect( () => {
		if ( isAdminActive ) {
			import( '@wordpress/lazy-editor' ).then( ( { loadEditorAssets } ) =>
				loadEditorAssets()
			);
		}
	}, [ isAdminActive ] );

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
							[ styles[ 'is-editor-pending' ] ]: isEditorPending,
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
									ref={ barStartRefs }
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
								{ /* Admin screens are named in the bar, in the same place as documents, rather than in a header of their own. */ }
								{ isAdminActive && pageTrail && (
									<ShellPageBar items={ pageTrail } />
								) }
								<div
									ref={ barEndRefs }
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
										<ShellNewMenu />
										<ShellSearch />
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
									<ShellSiteIdentity />
									<div className={ styles[ 'menu-content' ] }>
										<Navigation />
									</div>
								</nav>
							</ThemeProvider>
							<div
								className={ styles.admin }
								onClickCapture={ ( event ) => {
									const href = ( event.target as Element )
										.closest( 'a[href]' )
										?.getAttribute( 'href' );
									const to = href
										? new URL(
												href,
												window.location.href
											).searchParams.get( 'p' )
										: null;
									const match = to?.match(
										/^\/types\/([^/]+)\/edit\/(\d+)$/
									);
									if (
										! to ||
										! match ||
										event.metaKey ||
										event.ctrlKey ||
										event.shiftKey
									) {
										return;
									}
									event.preventDefault();
									openFromAdmin( to, match[ 1 ], match[ 2 ] );
								} }
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
								ref={ siteRef }
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
							<div ref={ editorRef } className={ styles.editor }>
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
