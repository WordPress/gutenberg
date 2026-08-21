import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Keeps navigation inside the previewed theme.
 *
 * Core renders frontend links and forms without the preview parameters, so a
 * plain click would silently land on the active theme. This mirrors the
 * Customizer's preview interception (`wp-includes/js/customize-preview.js`),
 * adapted to a same-origin iframe that navigates itself instead of messaging
 * a controlling pane:
 *
 * - Previewable links get the preview parameters injected into their query
 *   string — on load, and via a MutationObserver for links added later.
 * - Unpreviewable links (other sites, wp-admin, wp-login) get a `not-allowed`
 *   cursor and are blocked on click, with an announcement — spoken from the
 *   admin document, the only one `speak` can reach.
 * - GET form submissions to previewable URLs carry the parameters via hidden
 *   inputs; anything else (like POST comment forms) is blocked.
 */

const LINK_SELECTOR = 'a[href], area[href]';
const DEFAULT_PORTS = /:(80|443)$/;

type LinkLocation = Pick< HTMLAnchorElement, 'protocol' | 'host' | 'pathname' >;
type PreviewLink = HTMLAnchorElement | HTMLAreaElement;

export function setupPreviewNavigation(
	doc: Document,
	homeUrl: string,
	previewArgs: Record< string, string >
) {
	/*
	 * The previewed site's boundary, anchored to the server-authored home
	 * URL, matched like the Customizer's `isLinkPreviewable`: protocol, host,
	 * and path prefix, excluding login/signup and wp-admin/includes/content.
	 */
	const allowed = new URL( homeUrl );
	const allowedHost = allowed.host.replace( DEFAULT_PORTS, '' );
	const allowedPath = allowed.pathname.replace( /\/$/, '' );
	const isPreviewable = ( location: LinkLocation ) =>
		location.protocol === allowed.protocol &&
		location.host.replace( DEFAULT_PORTS, '' ) === allowedHost &&
		location.pathname.startsWith( allowedPath ) &&
		! /\/wp-(login|signup)\.php$/.test( location.pathname ) &&
		! /\/wp-(admin|includes|content)(\/|$)/.test( location.pathname );

	// Rewrites a link for previewing; false means the link must not be
	// followed from the preview.
	const prepareLink = ( link: PreviewLink ) => {
		const href = link.getAttribute( 'href' );
		// Leave jump links and non-web protocols (mailto:, javascript:) alone.
		if (
			! href ||
			href.startsWith( '#' ) ||
			! /^https?:$/.test( link.protocol )
		) {
			return true;
		}
		if ( ! isPreviewable( link ) ) {
			link.style.cursor = 'not-allowed';
			return false;
		}
		link.style.cursor = '';
		link.href = addQueryArgs( link.href, previewArgs );
		return true;
	};

	const prepareLinksIn = ( node: ParentNode ) =>
		node
			.querySelectorAll< PreviewLink >( LINK_SELECTOR )
			.forEach( ( link ) => prepareLink( link ) );

	prepareLinksIn( doc );
	new MutationObserver( ( mutations ) => {
		new Set( mutations.map( ( mutation ) => mutation.target ) ).forEach(
			( target ) => prepareLinksIn( target as ParentNode )
		);
	} ).observe( doc.documentElement, { childList: true, subtree: true } );

	doc.addEventListener( 'click', ( event ) => {
		const link = ( event.target as Element | null )?.closest?.(
			LINK_SELECTOR
		) as PreviewLink | null;
		if ( link && ! prepareLink( link ) ) {
			speak( __( 'This link is not live-previewable.' ) );
			event.preventDefault();
		}
	} );

	doc.addEventListener( 'submit', ( event ) => {
		const form = event.target as HTMLFormElement;
		// An anchor rather than `new URL()`: it resolves relative actions
		// against the document and never throws on malformed ones.
		const action = doc.createElement( 'a' );
		action.href = form.getAttribute( 'action' ) ?? '';
		if (
			'GET' !== form.method.toUpperCase() ||
			! isPreviewable( action )
		) {
			speak( __( 'Form submission not previewable.' ) );
			event.preventDefault();
			return;
		}
		Object.entries( previewArgs ).forEach( ( [ name, value ] ) => {
			if ( ! form.elements.namedItem( name ) ) {
				const input = doc.createElement( 'input' );
				input.type = 'hidden';
				input.name = name;
				input.value = value;
				form.appendChild( input );
			}
		} );
	} );
}
