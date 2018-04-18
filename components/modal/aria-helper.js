let appElement = null;

export function setAppElement( node ) {
	if ( ! appElement ) {
		appElement = node;
	}
}

export function hideApp() {
	appElement.setAttribute( 'aria-hidden', 'true' );
}

export function showApp() {
	appElement.removeAttribute( 'aria-hidden' );
}
