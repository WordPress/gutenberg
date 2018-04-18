let appElement = null;

export function setAppElement( node ) {
	if ( ! appElement ) {
		appElement = node;
	}
}

export function hideApp() {
	if ( appElement ) {
		appElement.setAttribute( 'aria-hidden', 'true' );
	}
}

export function showApp() {
	if ( appElement ) {
		appElement.removeAttribute( 'aria-hidden' );
	}
}
