let appElement = null,
	counter = 0;

export function setAppElement( node ) {
	if ( ! appElement ) {
		appElement = node;
	}
}

export function hideApp() {
	counter++;
	appElement.setAttribute( 'aria-hidden', 'true' );
}

export function showApp() {
	counter--;
	if ( counter === 0 ) {
		appElement.removeAttribute( 'aria-hidden' );
	}
}
