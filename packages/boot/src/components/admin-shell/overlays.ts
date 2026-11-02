/*
 * Overlays, such as modals, popovers and snackbars, are often rendered into
 * `<body>` rather than inside their page's app, so hiding the app doesn't hide
 * them. The shell tags each element added to `<body>` with the page showing
 * when it appeared, and hides it while another page is showing.
 *
 * Containers shared by every page, such as the Popover fallback container,
 * can't be told apart this way and are left alone.
 */

const PAGE_ATTRIBUTE = 'data-admin-shell-page';
const HIDDEN_ATTRIBUTE = 'data-admin-shell-hidden';

// Elements that belong to the document rather than to a page.
const DOCUMENT_ELEMENTS = [
	'script',
	'style',
	'link',
	'template',
	'#wpwrap',
	'.a11y-speak-region',
	'.a11y-speak-intro-text',
	'.components-popover__fallback-container',
].join( ', ' );

/**
 * Starts tagging elements added to `<body>` with the page showing at the time.
 *
 * @param getActivePageKey Returns the page showing.
 */
export function trackOverlays( getActivePageKey: () => string ) {
	const style = document.createElement( 'style' );
	style.textContent = `body > [${ HIDDEN_ATTRIBUTE }] { display: none !important; }`;
	document.head.append( style );

	new MutationObserver( ( records ) => {
		for ( const record of records ) {
			record.addedNodes.forEach( ( node ) => {
				if (
					node instanceof HTMLElement &&
					! node.hasAttribute( PAGE_ATTRIBUTE ) &&
					! node.matches( DOCUMENT_ELEMENTS )
				) {
					node.setAttribute( PAGE_ATTRIBUTE, getActivePageKey() );
				}
			} );
		}
	} ).observe( document.body, { childList: true } );
}

/**
 * Shows the overlays of `pageKey` and hides those of other pages.
 *
 * @param pageKey Page now showing.
 */
export function showOverlaysOf( pageKey: string ) {
	document.body
		.querySelectorAll( `:scope > [${ PAGE_ATTRIBUTE }]` )
		.forEach( ( element ) =>
			element.toggleAttribute(
				HIDDEN_ATTRIBUTE,
				element.getAttribute( PAGE_ATTRIBUTE ) !== pageKey
			)
		);
}
