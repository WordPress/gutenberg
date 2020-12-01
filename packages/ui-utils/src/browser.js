export function detectBrowser( browser ) {
	return window?.navigator?.userAgent.toLowerCase().indexOf( browser ) > -1;
}

export function isChrome() {
	return detectBrowser( 'chrome' );
}

export function isFirefox() {
	return detectBrowser( 'firefox' );
}

export function isSafari() {
	return detectBrowser( 'safari' );
}
