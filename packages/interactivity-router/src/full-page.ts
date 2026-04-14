// Check if the link is valid for client-side navigation.
const isValidLink = ( ref: HTMLAnchorElement ) =>
	ref &&
	ref instanceof window.HTMLAnchorElement &&
	ref.href &&
	( ! ref.target || ref.target === '_self' ) &&
	ref.origin === window.location.origin &&
	! ref.pathname.startsWith( '/wp-admin' ) &&
	! ref.pathname.startsWith( '/wp-login.php' ) &&
	! ref.getAttribute( 'href' ).startsWith( '#' ) &&
	! new URL( ref.href ).searchParams.has( '_wpnonce' );

// Check if the event is valid for client-side navigation.
const isValidEvent = ( event: MouseEvent ) =>
	event &&
	event.button === 0 && // Left clicks only.
	! event.metaKey && // Open in new tab (Mac).
	! event.ctrlKey && // Open in new tab (Windows).
	! event.altKey && // Download.
	! event.shiftKey &&
	! event.defaultPrevented;

// Navigate on click.
document.addEventListener( 'click', async ( event ) => {
	const ref = ( event.target as Element ).closest( 'a' );
	if ( isValidLink( ref ) && isValidEvent( event ) ) {
		event.preventDefault();
		const { actions } = await import( '@wordpress/interactivity-router' );
		actions.navigate( ref.href );
	}
} );
// Prefetch on hover.
document.addEventListener(
	'mouseenter',
	async ( event ) => {
		if ( ( event.target as Element )?.nodeName === 'A' ) {
			const ref = ( event.target as Element ).closest( 'a' );
			if ( isValidLink( ref ) && isValidEvent( event ) ) {
				const { actions } = await import(
					'@wordpress/interactivity-router'
				);
				actions.prefetch( ref.href );
			}
		}
	},
	true
);
