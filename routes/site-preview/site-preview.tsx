import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type SyntheticEvent,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs, getProtocol } from '@wordpress/url';
import { layout, page, post } from '@wordpress/icons';
import { Badge, Icon, Stack, Text } from '@wordpress/ui';
import type { ReactNode } from 'react';
import styles from './style.module.scss';

const PREVIEW_CONTEXT_ID = 'wp-site-preview-context';
const PREVIEW_QUERY_ARG = 'wp_site_preview';

// The server prints every theme.json style (variables, root and block styles
// and custom CSS) into this element.
const SERVER_GLOBAL_STYLES_ID = 'global-styles-inline-css';
const INJECTED_ATTRIBUTE = 'data-wp-site-preview';
const REPLACED_ATTRIBUTE = 'data-wp-site-preview-replaced';

type FrameArgs = Record< string, string >;

/**
 * What the server reports about the location the preview shows.
 */
export type SitePreviewContext = {
	url: string;
	postType: string;
	postTypeLabel: string;
	postId: string;
	postTitle: string;
	templateId: string;
	templateTitle: string;
};

/**
 * Global styles that replace the ones the server rendered, so the preview
 * reflects edits that are not saved yet.
 */
export type SitePreviewGlobalStyles = {
	/** Stylesheets, in order, each printed in its own style element. */
	css: string[];
	/** SVG markup the stylesheets refer to, such as duotone filters. */
	svgs?: string;
};

export type SitePreviewProps = {
	/** The site's home URL. */
	siteUrl: string;
	/**
	 * The previewed location, as a path relative to the site's origin. Any
	 * other value previews the site home.
	 */
	path?: unknown;
	/**
	 * Called when the preview navigates, with the new path, or `undefined`
	 * when it is the site home. The route keeps it in its search params.
	 */
	onPathChange: ( path: string | undefined ) => void;
	/**
	 * Query args carried on every location the preview loads, such as
	 * `wp_theme_preview`. They are left out of the paths and URLs it reports.
	 */
	queryArgs?: FrameArgs;
	/** Replaces the server-rendered global styles when given. */
	globalStyles?: SitePreviewGlobalStyles;
	/** Renders the actions at the end of the address bar. */
	renderActions?: ( props: {
		context: SitePreviewContext | null;
		publicUrl: string;
	} ) => ReactNode;
};

// The previewed location is kept in the route's search params, so returning
// through history restores it. The context of that location is kept here so
// the bar is filled in before the iframe loads again.
let lastPreviewContext: SitePreviewContext | null = null;

function isPreviewContext( value: unknown ): value is SitePreviewContext {
	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	const candidate = value as Record< string, unknown >;
	return (
		typeof candidate.url === 'string' &&
		typeof candidate.postType === 'string' &&
		typeof candidate.postTypeLabel === 'string' &&
		typeof candidate.postId === 'string' &&
		typeof candidate.postTitle === 'string' &&
		typeof candidate.templateId === 'string' &&
		typeof candidate.templateTitle === 'string'
	);
}

function readPreviewContext(
	iframeDocument: Document
): SitePreviewContext | null {
	const script = iframeDocument.getElementById( PREVIEW_CONTEXT_ID );
	if ( ! script?.textContent ) {
		return null;
	}

	try {
		const parsed: unknown = JSON.parse( script.textContent );
		return isPreviewContext( parsed ) ? parsed : null;
	} catch {
		return null;
	}
}

function isModifiedClick( event: MouseEvent ): boolean {
	return (
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	);
}

function withoutFrameArgs( url: URL, frameArgs: FrameArgs ): URL {
	const stripped = new URL( url.href );
	const params = new URLSearchParams( stripped.search );
	Object.keys( frameArgs ).forEach( ( name ) => params.delete( name ) );
	stripped.search = params.toString();
	return stripped;
}

function getFrameUrl( url: string, frameArgs: FrameArgs ): string {
	return addQueryArgs( url, frameArgs );
}

function getPublicUrl( url: string, frameArgs: FrameArgs ): string {
	try {
		return withoutFrameArgs( new URL( url ), frameArgs ).href;
	} catch {
		return url;
	}
}

function getPreviewPath( url: string, frameArgs: FrameArgs ): string {
	const { pathname, search, hash } = withoutFrameArgs(
		new URL( url ),
		frameArgs
	);
	return `${ pathname }${ search }${ hash }`;
}

function isInPageHashNavigation(
	href: string,
	currentHref: string,
	frameArgs: FrameArgs
): boolean {
	try {
		const target = withoutFrameArgs(
			new URL( href, currentHref ),
			frameArgs
		);
		const current = withoutFrameArgs( new URL( currentHref ), frameArgs );
		return (
			target.origin === current.origin &&
			target.pathname === current.pathname &&
			target.search === current.search &&
			!! target.hash
		);
	} catch {
		return false;
	}
}

function isFrontEndUrl( href: string, siteUrl: string ): boolean {
	let target: URL;
	let site: URL;
	try {
		target = new URL( href, siteUrl );
		site = new URL( siteUrl );
	} catch {
		return false;
	}

	const protocol = getProtocol( target.href );
	if ( protocol && protocol !== 'http:' && protocol !== 'https:' ) {
		return false;
	}

	// The site is the same over HTTP and HTTPS, so compare hosts rather
	// than origins: an admin loaded over HTTPS still links to an HTTP home.
	if ( target.host !== site.host ) {
		return false;
	}

	if ( /\/wp-admin(?:\/|$)/.test( target.pathname ) ) {
		return false;
	}

	if ( /wp-login\.php$/.test( target.pathname ) ) {
		return false;
	}

	return true;
}

function getPreviewTarget( path: unknown, siteUrl: string ): string {
	if ( typeof path === 'string' && path.startsWith( '/' ) ) {
		const target = new URL( path, siteUrl ).href;
		if ( isFrontEndUrl( target, siteUrl ) ) {
			return target;
		}
	}

	return siteUrl;
}

function getEntityIcon( context: SitePreviewContext ) {
	if ( context.postType === 'post' ) {
		return post;
	}

	// Other post types cannot declare their own icon yet.
	if ( context.postType ) {
		return page;
	}

	return layout;
}

function getEntityLabel( context: SitePreviewContext ): string {
	if ( context.postType ) {
		return sprintf(
			/* translators: 1: post type label, e.g. "Page". 2: post title. */
			__( '%1$s: %2$s' ),
			context.postTypeLabel || __( 'Page' ),
			context.postTitle || __( '(no title)' )
		);
	}

	if ( context.templateTitle ) {
		return sprintf(
			/* translators: %s: template title, e.g. "Index". */
			__( 'Template: %s' ),
			context.templateTitle
		);
	}

	return __( 'Template' );
}

/**
 * Swaps the server-rendered global styles of a preview document for the given
 * ones, or restores them when none are given.
 *
 * The replacement is printed where the server's styles were, so it keeps
 * their place in the cascade.
 *
 * @param iframeDocument The preview document.
 * @param globalStyles   The global styles to show.
 */
function applyGlobalStyles(
	iframeDocument: Document,
	globalStyles?: SitePreviewGlobalStyles
) {
	iframeDocument
		.querySelectorAll( `[${ INJECTED_ATTRIBUTE }]` )
		.forEach( ( element ) => element.remove() );

	const serverStyles = iframeDocument.getElementById(
		SERVER_GLOBAL_STYLES_ID
	);

	if ( ! globalStyles ) {
		if ( serverStyles?.hasAttribute( REPLACED_ATTRIBUTE ) ) {
			serverStyles.removeAttribute( REPLACED_ATTRIBUTE );
			serverStyles.removeAttribute( 'media' );
		}
		return;
	}

	const fragment = iframeDocument.createDocumentFragment();
	globalStyles.css.forEach( ( css ) => {
		if ( ! css ) {
			return;
		}
		const style = iframeDocument.createElement( 'style' );
		style.setAttribute( INJECTED_ATTRIBUTE, '' );
		style.textContent = css;
		fragment.appendChild( style );
	} );

	if ( serverStyles?.parentNode ) {
		serverStyles.setAttribute( REPLACED_ATTRIBUTE, '' );
		serverStyles.setAttribute( 'media', 'not all' );
		serverStyles.parentNode.insertBefore(
			fragment,
			serverStyles.nextSibling
		);
	} else {
		iframeDocument.head.appendChild( fragment );
	}

	if ( globalStyles.svgs && iframeDocument.body ) {
		// Hidden without `display: none`, which would disable the filters.
		const container = iframeDocument.createElement( 'div' );
		container.setAttribute( INJECTED_ATTRIBUTE, '' );
		container.setAttribute( 'aria-hidden', 'true' );
		container.style.cssText =
			'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;';
		container.innerHTML = globalStyles.svgs;
		iframeDocument.body.appendChild( container );
	}
}

function bindPreviewNavigation(
	iframe: HTMLIFrameElement,
	siteUrl: string,
	frameArgs: FrameArgs
): void {
	const iframeDocument = iframe.contentDocument;
	const iframeWindow = iframe.contentWindow as
		( Window & typeof globalThis ) | null;
	if ( ! iframeDocument || ! iframeWindow || ! siteUrl ) {
		return;
	}

	iframeDocument.addEventListener(
		'click',
		( event ) => {
			if ( event.defaultPrevented || isModifiedClick( event ) ) {
				return;
			}

			const eventTarget = event.target;
			if ( ! ( eventTarget instanceof iframeWindow.Element ) ) {
				return;
			}

			const anchor = eventTarget.closest( 'a[href]' );
			if ( ! anchor || anchor.hasAttribute( 'download' ) ) {
				return;
			}

			const href = anchor.getAttribute( 'href' );
			if ( ! href ) {
				return;
			}

			const resolvedUrl = new URL( href, iframeWindow.location.href );
			// Keep the frame on the protocol it is shown over, so a link to
			// the HTTP home never loads HTTP inside an HTTPS admin.
			if ( resolvedUrl.host === iframeWindow.location.host ) {
				resolvedUrl.protocol = iframeWindow.location.protocol;
			}
			const resolvedHref = resolvedUrl.href;

			if (
				isInPageHashNavigation(
					resolvedHref,
					iframeWindow.location.href,
					frameArgs
				)
			) {
				return;
			}

			if ( ! isFrontEndUrl( resolvedHref, siteUrl ) ) {
				event.preventDefault();
				event.stopPropagation();
				window.open( resolvedHref, '_blank', 'noopener' );
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			iframe.src = getFrameUrl( resolvedHref, frameArgs );
		},
		true
	);

	iframeDocument.addEventListener(
		'submit',
		( event ) => {
			const form = event.target;
			if ( ! ( form instanceof iframeWindow.HTMLFormElement ) ) {
				return;
			}

			let actionUrl: string;
			try {
				actionUrl = new URL(
					form.getAttribute( 'action' ) || '',
					iframeWindow.location.href
				).href;
			} catch {
				return;
			}

			if ( ! isFrontEndUrl( actionUrl, siteUrl ) ) {
				form.target = '_blank';
				return;
			}

			form.target = '';

			// A GET submission replaces the action's query string with the
			// form's fields, so the args have to be fields as well.
			if ( form.method.toLowerCase() === 'get' ) {
				Object.entries( frameArgs ).forEach( ( [ name, value ] ) => {
					if ( form.elements.namedItem( name ) ) {
						return;
					}
					const input = iframeDocument.createElement( 'input' );
					input.type = 'hidden';
					input.name = name;
					input.value = value;
					form.appendChild( input );
				} );
				return;
			}

			form.setAttribute( 'action', getFrameUrl( actionUrl, frameArgs ) );
		},
		true
	);
}

/**
 * The site's home URL, once known.
 */
export function useSiteUrl(): string | undefined {
	return useSelect( ( select ) => {
		const siteData = select( coreStore ).getEntityRecord(
			'root',
			'__unstableBase'
		) as { home?: unknown } | undefined;
		return typeof siteData?.home === 'string' ? siteData.home : undefined;
	}, [] );
}

/**
 * A navigable preview of the site's front end, with an address bar showing
 * the current URL and what renders it.
 *
 * @param props               Component props.
 * @param props.siteUrl       The site's home URL.
 * @param props.path          The previewed location.
 * @param props.onPathChange  Called when the preview navigates.
 * @param props.queryArgs     Query args carried on every loaded location.
 * @param props.globalStyles  Replaces the server-rendered global styles.
 * @param props.renderActions Renders the address bar actions.
 */
export function SitePreview( {
	siteUrl,
	path,
	onPathChange,
	queryArgs,
	globalStyles,
	renderActions,
}: SitePreviewProps ) {
	// Keyed on the contents so callers do not need to memoize the object.
	const queryArgsKey = JSON.stringify( queryArgs ?? {} );
	const frameArgs = useMemo< FrameArgs >(
		() => ( {
			...JSON.parse( queryArgsKey ),
			[ PREVIEW_QUERY_ARG ]: '1',
		} ),
		[ queryArgsKey ]
	);

	const targetUrl = getPreviewTarget( path, siteUrl );
	const [ initialSrc ] = useState( () =>
		getFrameUrl( targetUrl, frameArgs )
	);
	const [ context, setContext ] = useState< SitePreviewContext | null >(
		() =>
			lastPreviewContext?.url &&
			getPreviewPath( lastPreviewContext.url, frameArgs ) ===
				getPreviewPath( targetUrl, frameArgs )
				? lastPreviewContext
				: null
	);
	const [ loadedDocument, setLoadedDocument ] = useState< Document | null >(
		null
	);
	const iframeRef = useRef< HTMLIFrameElement >( null );
	const loadedUrlRef = useRef< string | null >( null );

	// Follows navigation that changes the path from outside the iframe, such
	// as the Home navigation item.
	useEffect( () => {
		const iframe = iframeRef.current;
		if (
			! iframe ||
			! loadedUrlRef.current ||
			getPreviewPath( loadedUrlRef.current, frameArgs ) ===
				getPreviewPath( targetUrl, frameArgs )
		) {
			return;
		}

		loadedUrlRef.current = targetUrl;
		iframe.src = getFrameUrl( targetUrl, frameArgs );
	}, [ targetUrl, frameArgs ] );

	useEffect( () => {
		if ( loadedDocument ) {
			applyGlobalStyles( loadedDocument, globalStyles );
		}
	}, [ loadedDocument, globalStyles ] );

	const onIframeLoad = useCallback(
		( event: SyntheticEvent< HTMLIFrameElement > ) => {
			const iframe = event.currentTarget;
			const iframeDocument = iframe.contentDocument;
			if ( ! iframeDocument ) {
				return;
			}

			const loadedContext = readPreviewContext( iframeDocument );
			lastPreviewContext = loadedContext;
			setContext( loadedContext );
			setLoadedDocument( iframeDocument );
			bindPreviewNavigation( iframe, siteUrl, frameArgs );

			const loadedUrl = loadedContext?.url;
			if ( ! loadedUrl || ! isFrontEndUrl( loadedUrl, siteUrl ) ) {
				return;
			}

			loadedUrlRef.current = loadedUrl;
			const loadedPath = getPreviewPath( loadedUrl, frameArgs );
			if ( loadedPath === getPreviewPath( targetUrl, frameArgs ) ) {
				return;
			}

			onPathChange(
				loadedPath === getPreviewPath( siteUrl, frameArgs )
					? undefined
					: loadedPath
			);
		},
		[ onPathChange, siteUrl, targetUrl, frameArgs ]
	);

	const publicUrl = getPublicUrl( context?.url || siteUrl, frameArgs );

	return (
		<div className={ styles.preview }>
			<Stack
				direction="row"
				align="center"
				gap="sm"
				className={ styles.chrome }
				render={
					<div
						role="region"
						aria-label={ __( 'Preview address bar' ) }
					/>
				}
			>
				<Stack
					direction="row"
					align="center"
					gap="xs"
					className={ styles.url }
				>
					{ context ? (
						<Icon
							className={ styles[ 'url-icon' ] }
							icon={ getEntityIcon( context ) }
							size={ 20 }
						/>
					) : null }
					<Text className={ styles[ 'url-text' ] } variant="body-sm">
						{ publicUrl }
					</Text>
					{ context ? (
						<Badge className={ styles[ 'url-badge' ] }>
							{ getEntityLabel( context ) }
						</Badge>
					) : null }
				</Stack>
				{ renderActions ? (
					<Stack
						direction="row"
						align="center"
						gap="xs"
						className={ styles.actions }
					>
						{ renderActions( { context, publicUrl } ) }
					</Stack>
				) : null }
			</Stack>
			<iframe
				ref={ iframeRef }
				className={ styles.iframe }
				src={ initialSrc }
				title={ __( 'Site preview' ) }
				onLoad={ onIframeLoad }
			/>
		</div>
	);
}
